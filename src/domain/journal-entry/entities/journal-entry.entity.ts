import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import dateUtils from '../../../shared/utils/date';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import { AppError } from '../../../shared/value-objects/error';
import { ICurrency } from '../../currency/types/currency.types';
import journalEntryEvents from '../events/journal-entry.events';
import {
  EJournalEntryStatus,
  IJournalEntry,
  IJournalLineItem,
  UJournalEntryStatus,
} from '../types/journal-entry.types';
import journalLineItemEntity from './journal-line-item.entity';

interface IMakePayload extends Omit<
  TCreationOmits<IJournalEntry, 'version'>,
  'lineItems'
> {
  functionalCurrency: ICurrency;
  lineItems: TCreationOmits<
    IJournalLineItem,
    'id' | 'functionalAmount' | 'version' | 'entryId'
  >[];
}

function validateStatus(status: UJournalEntryStatus) {
  if (!Object.values(EJournalEntryStatus).includes(status)) {
    throw new AppError('Invalid status', { cause: status });
  }
}

function make(
  payload: IMakePayload
): TEntityWithEvents<IJournalEntry, IJournalEntry | IJournalLineItem> {
  stringUtils.validateUUID(payload.accountingEntityId);
  stringUtils.validateUUID(payload.transactionId);
  validateStatus(payload.status);
  dateUtils.validateDate(payload.effectiveDate);
  if (payload.postedAt) dateUtils.validateDate(payload.postedAt);
  if (payload.voidedAt) dateUtils.validateDate(payload.voidedAt);
  if (payload.voidedByJournalEntryId)
    stringUtils.validateUUID(payload.voidedByJournalEntryId);

  const id = generateUUID();
  const timestamp = new Date();

  const lineItemsWithEvents = payload.lineItems.map((item) =>
    journalLineItemEntity.make(
      { id, memo: payload.memo, createdAt: timestamp },
      item,
      payload.functionalCurrency
    )
  );

  const lineItems = lineItemsWithEvents.map(([item]) => item);
  const events = lineItemsWithEvents.flatMap(([, event]) => event);
  const memo = stringUtils.sanitizeAndValidate(payload.memo, {
    max: 100,
    min: 1,
  });

  const entry: IJournalEntry = {
    id,
    accountingEntityId: payload.accountingEntityId,
    transactionId: payload.transactionId,
    lineItems,
    memo,
    status: payload.status,
    effectiveDate: payload.effectiveDate,
    postedAt: payload.postedAt,
    voidedAt: payload.voidedAt,
    voidedByJournalEntryId: payload.voidedByJournalEntryId,
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const entityEvent = journalEntryEvents.created(entry);

  return [Object.freeze(entry), [entityEvent, ...events]];
}

const journalEntryEntity = Object.freeze({
  make,

  validateStatus,
});

export default journalEntryEntity;
