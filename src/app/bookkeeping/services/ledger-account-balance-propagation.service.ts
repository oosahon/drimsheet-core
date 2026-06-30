import balanceEffectRule from '../../../domain/accounting/rules/bookkeeping/balance-effect.rule';
import journalEntryError from '../../../domain/journal-entry/errors/journal-entry.error';
import {
  EJournalEntryStatus,
  IJournalEntry,
} from '../../../domain/journal-entry/types/journal-entry.types';
import { IJournalLine } from '../../../domain/journal-entry/types/journal-line.types';
import { ELedgerAccountBalanceEffect } from '../../../domain/ledger/account-balance/types/ledger-account-balance.types';
import ILedgerAccountRepo from '../../../domain/ledger/shared/repos/ledger-account.repo';
import { ILedgerAccount } from '../../../domain/ledger/shared/types/ledger.types';
import { IMoney } from '../../../shared/types/money.types';
import { TEntityId } from '../../../shared/types/uuid';
import moneyValue from '../../../shared/value-objects/money.vo';
import ILedgerBalanceAdjustmentQueue from '../../ledger/contracts/ledger-balance-adjustment-queue.contract';
import { ILedgerAccountBalanceAdjustmentDto } from '../../ledger/dtos/ledger-account-balance-adjustment.dto';
import moneyMapper from '../../shared/mappers/money.mapper';
import { ILedgerAccountBalancePropagationService } from '../contracts/ledger-account-balance-adjustment-service.contract';

function getAccountMap(
  journalEntry: IJournalEntry
): Map<TEntityId, IJournalLine[]> {
  const accountMap = new Map<TEntityId, IJournalLine[]>();

  journalEntry.lines.forEach((line) => {
    const accountLines = accountMap.get(line.accountId);

    if (accountLines) {
      accountLines.push(line);
    } else {
      accountMap.set(line.accountId, [line]);
    }
  });

  return accountMap;
}

function validateLines(journalLines: IJournalLine[], account: ILedgerAccount) {
  const isSame = journalLines.every((line) => {
    const prototype = journalLines[0];

    const isSameAccount = line.accountId === account.id;

    const isSameFunctionalCurrency =
      line.functionalAmount.currency.code ===
      prototype.functionalAmount.currency.code;

    const isSameCurrencyAsAccount =
      line.amount.currency.code === account.currency.code;

    return isSameAccount && isSameFunctionalCurrency && isSameCurrencyAsAccount;
  });

  if (!isSame) {
    throw new journalEntryError.MismatchedJournalLines({
      cause: journalLines.map((v) => ({
        accountId: v.accountId,
        functionalCurrency: v.functionalAmount.currency,
        currency: v.amount.currency,
      })),
    });
  }
}

export default function makeLedgerAccountBalancePropagationService(
  ledgerAccountRepo: ILedgerAccountRepo,
  ledgerBalanceAdjustmentQueue: ILedgerBalanceAdjustmentQueue
): ILedgerAccountBalancePropagationService {
  return {
    async propagate(journalEntry, repoOptions) {
      if (journalEntry.status === EJournalEntryStatus.Draft) {
        return;
      }

      const allAdjustments: ILedgerAccountBalanceAdjustmentDto[] = [];

      const accountMap = getAccountMap(journalEntry);

      for (const [accountId, journalLines] of accountMap.entries()) {
        const account = await ledgerAccountRepo.findById(
          accountId,
          repoOptions
        );

        if (!account) {
          throw new journalEntryError.AccountNotFound({ cause: { accountId } });
        }

        validateLines(journalLines, account);

        let balanceDelta: IMoney = moneyValue.makeZeroAmount(account.currency);
        let functionalBalanceDelta: IMoney = moneyValue.makeZeroAmount(
          journalLines[0].functionalAmount.currency
        );

        for (const line of journalLines) {
          const effect = balanceEffectRule.derive(account, line.side);

          if (effect === ELedgerAccountBalanceEffect.Increase) {
            balanceDelta = moneyValue.add(balanceDelta, line.amount);
            functionalBalanceDelta = moneyValue.add(
              functionalBalanceDelta,
              line.functionalAmount
            );
          } else {
            balanceDelta = moneyValue.subtract(balanceDelta, line.amount);
            functionalBalanceDelta = moneyValue.subtract(
              functionalBalanceDelta,
              line.functionalAmount
            );
          }
        }

        allAdjustments.push({
          journalEntry: {
            id: journalEntry.id,
            createdBy: journalEntry.createdBy,
          },
          correlationId: repoOptions.correlationId,
          balanceDelta: moneyMapper.toDto(balanceDelta),
          functionalBalanceDelta: moneyMapper.toDto(functionalBalanceDelta),
          ledgerAccountId: accountId,
        });
      }

      await Promise.all(
        allAdjustments.map((adjustment) =>
          ledgerBalanceAdjustmentQueue.add(adjustment)
        )
      );
    },
  };
}
