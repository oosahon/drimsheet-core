import IAccountingPeriodService from '../../accounting/types/accounting-period.service.types';
import currencyEntity from '../../money/entities/currency.entity';
import journalEntryEntity from '../entities/journal-entry.entity';
import { IJournalEntryService } from '../types/journal-entry.service.types';
import { EJournalEntrySourceType } from '../types/journal-entry.types';
import {
  EJournalSide,
  IJournalLineMakePayload,
} from '../types/journal-line.types';
import helpers from './helpers/journal-entry.service.helpers';

interface IDependencies {
  accountingPeriodService: IAccountingPeriodService;
}

function makeCreateReceipt(
  deps: IDependencies
): IJournalEntryService['createReceipt'] {
  return async (payload, repoOptions) => {
    const { header, sourceLine, destinationLines } = payload;

    await helpers.validateAccounts(payload);

    await deps.accountingPeriodService.validatePostingPeriod(
      header.accountingEntityId,
      header.effectiveDate,
      repoOptions
    );

    await helpers.validateCounterparties(payload);

    const functionalCurrency = currencyEntity.getByCode(
      header.functionalCurrencyCode
    );

    const sourceLinesPayload: IJournalLineMakePayload = {
      accountId: sourceLine.account.id,
      counterpartyId: sourceLine.counterparty?.id,
      sequenceOrder: sourceLine.sequenceOrder,
      amount: sourceLine.amount,
      exchangeRate: sourceLine.exchangeRate,
      side: EJournalSide.Credit,
      description: sourceLine.description,
      functionalCurrency,
    };
    const destinationLinesPayload: IJournalLineMakePayload[] =
      destinationLines.map((line) => ({
        accountId: line.account.id,
        counterpartyId: line.counterparty?.id,
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
      effectiveDate: header.effectiveDate,
      postedAt: header.postedAt,
      memo: header.memo,
      createdBy: header.createdBy,
      functionalCurrency,
      lines: [sourceLinesPayload, ...destinationLinesPayload],
    });
  };
}

export default function makeJournalEntryService(
  deps: IDependencies
): IJournalEntryService {
  return Object.freeze({
    createReceipt: makeCreateReceipt(deps),
  });
}
