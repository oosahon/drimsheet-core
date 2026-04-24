import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { IMoney } from '../../../shared/types/money.types';
import { AppError } from '../../../shared/value-objects/error';
import { IAccountingEntity } from '../../accounting-entity/types/accounting-entity.types';
import { IExchangeRate } from '../../currency/types/exchange-rate.types';
import journalEntryEntity from '../../journal-entry/entities/journal-entry.entity';
import { IMakePayload as IJournalLineMakePayload } from '../../journal-entry/entities/journal-line-item.entity';
import { EJournalEntryStatus } from '../../journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../journal-entry/types/journal-line.types';
import ILedgerAccountRepo from '../../ledger/repos/ledger-account.repo';
import { EEquitySubType } from '../../ledger/types/equity-account.types';
import { ELedgerType, ILedgerAccount } from '../../ledger/types/ledger.types';

interface IOpeningBalanceTransaction {
  accountingEntity: IAccountingEntity;
  account: ILedgerAccount;
  exchangeRate: IExchangeRate;
  amount: IMoney;
}

export default function makeAccountingService(
  ledgerAccountRepo: ILedgerAccountRepo
) {
  return {
    async recordOpeningBalanceTransaction(
      payload: IOpeningBalanceTransaction,
      repoOptions: IRepoOptions
    ) {
      const { account, amount, accountingEntity, exchangeRate } = payload;
      if (account.isControlAccount) {
        throw new AppError('Cannot set opening balance on control account', {
          cause: { accountId: account.id },
        });
      }

      const existingAccount = await ledgerAccountRepo.findById(
        payload.account.id,
        repoOptions
      );

      if (existingAccount) {
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
        functionalCurrency: accountingEntity.functionalCurrency,
        lineItems: [debitLinePayload, creditLinePayload],
      });

      return journalEntry;
    },
  };
}
