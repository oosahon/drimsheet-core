import { TEntityWithEvents } from '../../../shared/types/event.types';
import dateUtils from '../../../shared/utils/date';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import { ICurrency } from '../../currency/types/currency.types';
import journalEntryEvents from '../events/journal-entry.events';
import { IJournalEntry } from '../types/journal-entry.types';
import { IJournalLineItem } from '../types/journal-line-item.types';
import helpers from './helpers/journal-entry.entity.helpers';
import journalLineItemEntity, {
  IMakePayload as IJournalLineItemMakePayload,
} from './journal-line-item.entity';

interface IMakePayload extends Pick<
  IJournalEntry,
  | 'accountingEntityId'
  | 'transactionId'
  | 'status'
  | 'effectiveDate'
  | 'postedAt'
  | 'voidedAt'
  | 'voidedByJournalEntryId'
  | 'memo'
> {
  functionalCurrency: ICurrency;
  lineItems: IJournalLineItemMakePayload[];
}

function make(
  payload: IMakePayload
): TEntityWithEvents<IJournalEntry, IJournalEntry | IJournalLineItem> {
  stringUtils.validateUUID(payload.accountingEntityId);
  if (payload.transactionId) stringUtils.validateUUID(payload.transactionId);
  helpers.validateStatus(payload.status);
  dateUtils.validateDate(payload.effectiveDate);
  if (payload.postedAt) dateUtils.validateDate(payload.postedAt);
  if (payload.voidedAt) dateUtils.validateDate(payload.voidedAt);
  if (payload.voidedByJournalEntryId)
    stringUtils.validateUUID(payload.voidedByJournalEntryId);

  const id = generateUUID();
  const timestamp = new Date();

  const memo = stringUtils.sanitizeAndValidate(payload.memo, {
    max: 100,
    min: 1,
  });

  const lineItemsWithEvents = payload.lineItems.map((item) =>
    journalLineItemEntity.make({ id, memo, createdAt: timestamp }, item)
  );

  const lineItems = lineItemsWithEvents.map(([item]) => item);
  helpers.validateLineItems(lineItems);

  const events = lineItemsWithEvents.flatMap(([, event]) => event);

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

  ...helpers,
});

export default journalEntryEntity;
