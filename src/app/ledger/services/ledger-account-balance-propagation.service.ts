import IReporter from '@shared/contracts/reporter.contract';
import { IReadRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import ledgerBalanceEffectRule from '@domain/accounting/rules/ledger-balance-effect.rule';
import journalEntryError from '@domain/journal-entry/errors/journal-entry.error';
import {
  EJournalEntryStatus,
  IJournalEntry,
} from '@domain/journal-entry/types/journal-entry.types';
import { IJournalLine } from '@domain/journal-entry/types/journal-line.types';
import ILedgerAccountRepo from '@domain/ledger/repos/ledger-account.repo';
import { EEquitySubType } from '@domain/ledger/types/equity-account.types';
import { ELedgerAccountBalanceEffect } from '@domain/ledger/types/ledger-account-balance.types';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';
import { IMoney } from '@domain/money/types/money.types';
import moneyValue from '@domain/money/values/money.vo';

import { ILedgerAccountBalancePropagationService } from '@app/ledger/contracts/ledger-account-balance-propagation.service.contract';
import ILedgerBalanceAdjustmentQueue from '@app/ledger/contracts/ledger-balance-adjustment-queue.contract';
import { ILedgerAccountBalanceAdjustmentDto } from '@app/ledger/dtos/ledger-account-balance-adjustment/ledger-account-balance-adjustment.dto';
import moneyMapper from '@app/money/dtos/money/money.dto.mapper';

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
      account.currency === null ||
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

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
  ledgerBalanceAdjustmentQueue: ILedgerBalanceAdjustmentQueue;
  reporter: IReporter;
}

async function propagateBalanceAdjustments(
  deps: IDependencies,
  journalEntry: IJournalEntry,
  repoOptions: IReadRepoOptions
) {
  try {
    if (journalEntry.status === EJournalEntryStatus.Draft) {
      return;
    }

    const allAdjustments: ILedgerAccountBalanceAdjustmentDto[] = [];

    const accountMap = getAccountMap(journalEntry);

    for (const [accountId, journalLines] of accountMap.entries()) {
      const account = await deps.ledgerAccountRepo.findById(
        accountId,
        journalEntry.accountingEntityId,
        repoOptions
      );

      if (!account) {
        throw new journalEntryError.AccountNotFound({ cause: { accountId } });
      }

      if (account.subType === EEquitySubType.OpeningBalance) {
        continue;
      }

      validateLines(journalLines, account);

      const functionalCurrency = journalLines[0].functionalAmount.currency;
      const balanceCurrency = account.currency ?? functionalCurrency;
      let balanceDelta: IMoney = moneyValue.makeZeroAmount(balanceCurrency);
      let functionalBalanceDelta: IMoney =
        moneyValue.makeZeroAmount(functionalCurrency);

      for (const line of journalLines) {
        const effect = ledgerBalanceEffectRule(account, line.side);
        const accountAmount =
          account.currency === null ? line.functionalAmount : line.amount;

        if (effect === ELedgerAccountBalanceEffect.Increase) {
          balanceDelta = moneyValue.add(balanceDelta, accountAmount);
          functionalBalanceDelta = moneyValue.add(
            functionalBalanceDelta,
            line.functionalAmount
          );
        } else {
          balanceDelta = moneyValue.subtract(balanceDelta, accountAmount);
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
        accountingEntityId: journalEntry.accountingEntityId,
        correlationId: repoOptions.correlationId,
        balanceDelta: moneyMapper.toDto(balanceDelta),
        functionalBalanceDelta: moneyMapper.toDto(functionalBalanceDelta),
        ledgerAccountId: accountId,
      });
    }

    await Promise.all(
      allAdjustments.map((adjustment) =>
        deps.ledgerBalanceAdjustmentQueue.add(adjustment)
      )
    );
  } catch (error) {
    deps.reporter.report('ledger.balance_propagation.failed', error);
  }
}

export default function makeLedgerAccountBalancePropagationService(
  deps: IDependencies
): ILedgerAccountBalancePropagationService {
  return {
    propagate: (journalEntry, repoOptions) =>
      propagateBalanceAdjustments(deps, journalEntry, repoOptions),
  };
}
