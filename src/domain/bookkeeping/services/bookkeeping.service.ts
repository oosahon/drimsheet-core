import { IMoney } from '../../../shared/types/money.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { AppError } from '../../../shared/value-objects/error';
import moneyValue from '../../../shared/value-objects/money.vo';
import {
  ILedgerAccountBalanceEffectDelta,
  IOpeningBalanceTransaction,
} from '../../accounting/types/accounting.service.types';
import journalEntryEntity from '../../journal-entry/entities/journal-entry.entity';
import { IMakePayload as IJournalLineMakePayload } from '../../journal-entry/entities/journal-line.entity';
import { EJournalEntryStatus } from '../../journal-entry/types/journal-entry.types';
import {
  EJournalSide,
  IJournalLine,
} from '../../journal-entry/types/journal-line.types';
import ledgerAccountEntity from '../../ledger/entities/shared/ledger-account.entity';
import ILedgerAccountRepo from '../../ledger/repos/ledger-account.repo';
import { EEquitySubType } from '../../ledger/types/equity-account.types';
import { ELedgerType } from '../../ledger/types/ledger.types';
import ILedgerAccountBalanceRepo from '../repos/ledger-account-balance.repo';
import getBalanceEffectRule from '../rules/get-balance-effect.rule';
import { ELedgerAccountBalanceEffect } from '../types/ledger-account-balance.types';

export default function makeBookkeepingService(
  ledgerAccountRepo: ILedgerAccountRepo,
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo
) {
  return {
    async createOpeningBalanceJournalEntry(
      payload: IOpeningBalanceTransaction,
      repoOptions: IRepoOptions
    ) {
      const { account, amount, accountingEntity, exchangeRate } = payload;
      if (account.isControlAccount) {
        throw new AppError('Cannot set opening balance on control account', {
          cause: { accountId: account.id },
        });
      }

      const [existingBalanceAdjustment] =
        await ledgerAccountBalanceRepo.findAdjustmentsByAccountId(
          payload.account.id,
          { ...repoOptions, limit: 1 }
        );

      if (existingBalanceAdjustment) {
        throw new AppError('Opening balance has already been set', {
          cause: { accountId: payload.account.id },
        });
      }

      const [equityAccount] = await ledgerAccountRepo.findBySubType(
        account.accountingEntityId,
        ELedgerType.Equity,
        EEquitySubType.OpeningBalance,
        repoOptions
      );

      if (!equityAccount) {
        throw new AppError(
          'Account type for opening balance is not configured'
        );
      }

      const debitLinePayload: IJournalLineMakePayload = {
        accountId: account.id,
        functionalCurrency: accountingEntity.functionalCurrency,
        amount,
        exchangeRate,
        sequenceOrder: 1,
        side: EJournalSide.Debit,
        description: 'Opening balance',
      };

      const creditLinePayload: IJournalLineMakePayload = {
        accountId: equityAccount.id,
        functionalCurrency: accountingEntity.functionalCurrency,
        amount,
        exchangeRate,
        sequenceOrder: 2,
        side: EJournalSide.Credit,
      };

      const timestamp = new Date();

      const journalEntry = journalEntryEntity.make({
        accountingEntityId: account.accountingEntityId,
        transactionId: null,
        status: EJournalEntryStatus.Posted,
        effectiveDate: timestamp,
        postedAt: timestamp,
        voidedAt: null,
        voidingEntryId: null,
        memo: 'Opening balance',
        createdBy: account.createdBy,
        functionalCurrency: accountingEntity.functionalCurrency,
        lines: [debitLinePayload, creditLinePayload],
      });

      return journalEntry;
    },

    async getBalanceEffectDelta(
      accountId: TEntityId,
      journalLines: IJournalLine[],
      repoOptions: IRepoOptions
    ): Promise<ILedgerAccountBalanceEffectDelta> {
      const account = await ledgerAccountRepo.findById(accountId, repoOptions);

      if (!account) {
        throw new AppError('Account not found', { cause: { accountId } });
      }

      const isSame = journalLines.every((line) => {
        const prototype = journalLines[0];

        const isSameAccount = line.accountId === accountId;

        const isSameFunctionalCurrency =
          line.functionalAmount.currency.code ===
          prototype.functionalAmount.currency.code;

        const isSameCurrencyAsAccount =
          line.amount.currency.code === account.currency.code;

        return (
          isSameAccount && isSameFunctionalCurrency && isSameCurrencyAsAccount
        );
      });

      if (!isSame) {
        throw new AppError(
          'All lines must be associated with the same account, functional currency and currency',
          {
            cause: journalLines.map((v) => ({
              accountId: v.accountId,
              functionalCurrency: v.functionalAmount.currency,
              currency: v.amount.currency,
            })),
          }
        );
      }

      let balanceDelta: IMoney = moneyValue.makeZeroAmount(account.currency);
      let functionalBalanceDelta: IMoney = moneyValue.makeZeroAmount(
        journalLines[0].functionalAmount.currency
      );

      for (const line of journalLines) {
        const effect = getBalanceEffectRule({
          accountType: account.type,
          normalBalance: account.normalBalance,
          journalSide: line.side,
        });

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

      return {
        balanceDelta,
        functionalBalanceDelta,
        affectedLedgerCodes:
          ledgerAccountEntity.getAncestryCodesFromMaterializedPath(
            account.materializedPath
          ),
      };
    },
  };
}
