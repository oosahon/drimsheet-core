import currencyEntity from '../../../domain/currency/entities/currency.entity';
import journalEntryEntity from '../../../domain/journal-entry/entities/journal-entry.entity';
import journalLineEntity from '../../../domain/journal-entry/entities/journal-line.entity';
import journalEntryError from '../../../domain/journal-entry/errors/journal-entry.error';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../../../domain/journal-entry/types/journal-entry.types';
import { IJournalLineMakePayload } from '../../../domain/journal-entry/types/journal-line.types';
import ILedgerAccountBalanceRepo from '../../../domain/ledger/account-balance/repos/ledger-account-balance.repo';
import { EEquitySubType } from '../../../domain/ledger/equity-account/types/equity-account.types';
import ILedgerAccountRepo from '../../../domain/ledger/shared/repos/ledger-account.repo';
import { ELedgerType } from '../../../domain/ledger/shared/types/ledger.types';
import IOpeningBalanceEntryService from '../contracts/opening-balance-entry.service.contract';

interface IDependencies {
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo;
  ledgerAccountRepo: ILedgerAccountRepo;
}

export default function makeOpeningBalanceEntryService(
  deps: IDependencies
): IOpeningBalanceEntryService {
  return {
    async create(accountingEntity, account, amount, exchangeRate, repoOptions) {
      if (account.isControlAccount) {
        throw new journalEntryError.ControlAccountOpeningBalanceNotAllowed({
          accountId: account.id,
        });
      }

      const functionalCurrency = currencyEntity.getByCode(
        accountingEntity.functionalCurrencyCode
      );

      const [existingBalanceAdjustment] =
        await deps.ledgerAccountBalanceRepo.findAdjustmentsByAccountId(
          account.id,
          repoOptions
        );

      if (existingBalanceAdjustment) {
        throw new journalEntryError.ExistingOpeningBalance({
          accountId: account.id,
        });
      }

      const [equityAccount] = await deps.ledgerAccountRepo.findBySubType(
        account.accountingEntityId,
        ELedgerType.Equity,
        EEquitySubType.OpeningBalance,
        repoOptions
      );

      if (!equityAccount) {
        throw new journalEntryError.UnConfiguredOpeningBalanceAccount();
      }

      const accountSide: IJournalLineMakePayload = {
        accountId: account.id,
        // TODO: use current reporting context currency
        functionalCurrency,
        amount,
        exchangeRate,
        sequenceOrder: 1,
        side: account.normalBalance,
        description: 'Opening balance',
      };

      const equitySide: IJournalLineMakePayload = {
        accountId: equityAccount.id,
        // TODO: use current reporting context currency
        functionalCurrency,
        amount,
        exchangeRate,
        sequenceOrder: 2,
        description: null,
        side: journalLineEntity.getOppositeSide(account.normalBalance),
      };

      const timestamp = new Date();

      const journalEntry = journalEntryEntity.make({
        accountingEntityId: account.accountingEntityId,
        sourceType: EJournalEntrySourceType.OpeningBalance,
        counterPartyId: null,
        status: EJournalEntryStatus.Posted,
        effectiveDate: timestamp,
        postedAt: timestamp,
        voidedAt: null,
        voidingEntryId: null,
        memo: 'Opening balance',
        createdBy: account.createdBy,
        functionalCurrency,
        lines: [accountSide, equitySide],
      });

      return journalEntry;
    },
  };
}
