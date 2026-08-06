import ILedgerAccountBalanceRepo from '../../ledger/account-balance/repos/ledger-account-balance.repo';
import { EEquitySubType } from '../../ledger/equity-account/types/equity-account.types';
import ILedgerAccountRepo from '../../ledger/shared/repos/ledger-account.repo';
import { ELedgerType } from '../../ledger/shared/types/ledger.types';
import currencyEntity from '../../money/entities/currency.entity';
import journalEntryEntity from '../entities/journal-entry.entity';
import journalLineEntity from '../entities/journal-line.entity';
import journalEntryError from '../errors/journal-entry.error';
import { EJournalEntrySourceType } from '../types/journal-entry.types';
import { IJournalLineMakePayload } from '../types/journal-line.types';
import { IOpeningBalanceEntryService } from '../types/opening-balance-entry.service.types';

// TODO: move to journal entry service
interface IDependencies {
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo;
  ledgerAccountRepo: ILedgerAccountRepo;
}

function makeCreate(
  deps: IDependencies
): IOpeningBalanceEntryService['create'] {
  return async (payload, repoOptions) => {
    const {
      accountingEntityId,
      account,
      functionalCurrencyCode,
      amount,
      effectiveDate,
      exchangeRate,
      createdBy,
    } = payload;

    if (account.isControlAccount) {
      throw new journalEntryError.ControlAccountOpeningBalanceNotAllowed({
        accountId: account.id,
      });
    }

    if (account.openingBalanceDate !== null) {
      throw new journalEntryError.ExistingOpeningBalance({
        accountId: account.id,
      });
    }

    const functionalCurrency = currencyEntity.getByCode(functionalCurrencyCode);

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
      accountingEntityId,
      ELedgerType.Equity,
      EEquitySubType.OpeningBalance,
      repoOptions
    );

    if (!equityAccount) {
      throw new journalEntryError.UnConfiguredOpeningBalanceAccount();
    }

    const accountSide: IJournalLineMakePayload = {
      accountId: account.id,
      counterpartyId: null,
      functionalCurrency,
      amount,
      exchangeRate,
      sequenceOrder: 1,
      side: account.normalBalance,
      description: 'Opening balance',
    };

    const equitySide: IJournalLineMakePayload = {
      accountId: equityAccount.id,
      counterpartyId: null,
      functionalCurrency,
      amount,
      exchangeRate,
      sequenceOrder: 2,
      description: null,
      side: journalLineEntity.getOppositeSide(account.normalBalance),
    };

    const journalEntry = journalEntryEntity.make({
      accountingEntityId,
      sourceType: EJournalEntrySourceType.OpeningBalance,
      effectiveDate,
      postedAt: effectiveDate,
      memo: 'Opening balance',
      createdBy,
      functionalCurrency,
      lines: [accountSide, equitySide],
    });

    return journalEntry;
  };
}

export default function makeOpeningBalanceEntryService(
  deps: IDependencies
): IOpeningBalanceEntryService {
  return Object.freeze({
    create: makeCreate(deps),
  });
}
