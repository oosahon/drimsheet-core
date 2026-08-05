import { IReadRepoOptions } from '../../../shared/types/repo.types';
import dateUtils from '../../../shared/utils/date';
import IAccountingPeriodService from '../../accounting/types/accounting-period.service.types';
import ICounterpartyRepo from '../../counterparty/repos/counterparty.repo';
import { EAssetSubType } from '../../ledger/asset-account/types/asset-account.types';
import {
  ELedgerType,
  ULedgerType,
} from '../../ledger/shared/types/ledger.types';
import currencyEntity from '../../money/entities/currency.entity';
import journalEntryEntity from '../entities/journal-entry.entity';
import journalEntryError from '../errors/journal-entry.error';
import { EJournalEntrySourceType } from '../types/journal-entry.types';
import {
  EJournalSide,
  IJournalLineMakePayload,
} from '../types/journal-line.types';
import {
  ICreateReceiptEntryPayload,
  IReceiptEntryService,
} from '../types/receipt-entry.service.types';

interface IDependencies {
  counterpartyRepo: ICounterpartyRepo;
  accountingPeriodService: IAccountingPeriodService;
}

const ALLOWED_SOURCES: Set<ULedgerType> = new Set([
  ELedgerType.Revenue,
  ELedgerType.Liability,
]);

async function validate(
  deps: IDependencies,
  payload: ICreateReceiptEntryPayload,
  repoOptions: IReadRepoOptions
) {
  const { header, sourceLines, destinationLines } = payload;

  const allAccounts = sourceLines
    .map((sl) => sl.account)
    .concat(destinationLines.map((dl) => dl.account));

  // Assert that all sources are permitted
  const invalidSources = sourceLines.filter(
    (line) => !ALLOWED_SOURCES.has(line.account.type)
  );
  if (invalidSources.length > 0) {
    throw new journalEntryError.InvalidSourceType({ invalidSources });
  }

  // Assert that all destinations are permitted
  const invalidDestinations = destinationLines.filter(
    (v) => v.account.subType !== EAssetSubType.CashAndCashEquivalent
  );
  if (invalidDestinations.length > 0) {
    throw new journalEntryError.InvalidDestinationAccount({
      invalidDestinations,
    });
  }

  // Assert that all accounts belong to the same accounting entity
  const wrongAccountingEntities = allAccounts.filter(
    (acc) => acc.accountingEntityId !== header.accountingEntityId
  );
  if (wrongAccountingEntities.length) {
    throw new journalEntryError.InvalidAccountingEntity({
      accounts: wrongAccountingEntities,
    });
  }

  // Assert that no account is a posting account
  const controlAccounts = allAccounts.filter((acc) => acc.isControlAccount);
  if (controlAccounts.length > 0) {
    throw new journalEntryError.ControlAccountNotAllowed({
      accounts: controlAccounts.map((v) => v.id),
    });
  }

  // Assert that effective date is not before any account's opening date
  const erringEffectiveDates = allAccounts.filter(
    (acc) =>
      acc.openingBalanceDate === null ||
      dateUtils.isLessThan(acc.openingBalanceDate, header.effectiveDate)
  );

  if (erringEffectiveDates.length) {
    throw new journalEntryError.EffectiveDateIsBeforeOpeningDate({
      accounts: erringEffectiveDates.map((v) => v.id),
      effectiveDate: header.effectiveDate,
    });
  }

  // Assert that there's a accounting period open
  await deps.accountingPeriodService.validatePostingPeriod(
    header.accountingEntityId,
    header.effectiveDate,
    repoOptions
  );

  // Assert that the counterparty exists
  const counterparty = await deps.counterpartyRepo.findById(
    header.counterpartyId,
    header.accountingEntityId,
    repoOptions
  );

  if (!counterparty) {
    throw new journalEntryError.InvalidCounterpartyId({
      id: header.counterpartyId,
    });
  }
}

function makeCreate(deps: IDependencies): IReceiptEntryService['create'] {
  return async (payload, repoOptions) => {
    const { header, sourceLines, destinationLines } = payload;

    await validate(deps, payload, repoOptions);

    const functionalCurrency = currencyEntity.getByCode(
      header.functionalCurrencyCode
    );

    const sourceLinesPayload: IJournalLineMakePayload[] = sourceLines.map(
      (line) => ({
        accountId: line.account.id,
        sequenceOrder: line.sequenceOrder,
        amount: line.amount,
        exchangeRate: line.exchangeRate,
        side: EJournalSide.Credit,
        description: line.description,
        functionalCurrency,
      })
    );

    const destinationLinesPayload: IJournalLineMakePayload[] =
      destinationLines.map((line) => ({
        accountId: line.account.id,
        sequenceOrder: line.sequenceOrder,
        amount: line.amount,
        exchangeRate: line.exchangeRate,
        side: EJournalSide.Debit,
        description: line.description,
        functionalCurrency,
      }));

    return journalEntryEntity.make({
      accountingEntityId: header.accountingEntityId,
      sourceType: EJournalEntrySourceType.Receipt,
      counterPartyId: header.counterpartyId,
      effectiveDate: header.effectiveDate,
      postedAt: header.postedAt,
      memo: header.memo,
      createdBy: header.createdBy,
      functionalCurrency,
      lines: [...sourceLinesPayload, ...destinationLinesPayload],
    });
  };
}

export default function makeReceiptEntryService(
  deps: IDependencies
): IReceiptEntryService {
  return Object.freeze({
    create: makeCreate(deps),
  });
}
