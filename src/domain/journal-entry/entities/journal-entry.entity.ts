import { TEntityWithEvents } from '../../../shared/types/event.types';
import dateUtils from '../../../shared/utils/date';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import { ICurrency } from '../../currency/types/currency.types';
import journalEntryError from '../errors/journal-entry.error';
import journalEntryEvents from '../events/journal-entry.events';
import { IJournalEntry } from '../types/journal-entry.types';
import { IJournalLine } from '../types/journal-line.types';
import helpers from './helpers/journal-entry.entity.helpers';
import journalLineEntity, {
  IMakePayload as IJournalLineMakePayload,
} from './journal-line.entity';

interface IMakePayload extends Pick<
  IJournalEntry,
  | 'accountingEntityId'
  | 'sourceType'
  | 'counterPartyId'
  | 'status'
  | 'effectiveDate'
  | 'postedAt'
  | 'voidedAt'
  | 'voidingEntryId'
  | 'memo'
  | 'createdBy'
> {
  functionalCurrency: ICurrency;
  lines: IJournalLineMakePayload[];
}

function make(
  payload: IMakePayload
): TEntityWithEvents<IJournalEntry, IJournalEntry | IJournalLine> {
  stringUtils.validateUUID(
    payload.accountingEntityId,
    journalEntryError.InvalidValue
  );
  stringUtils.validateUUID(payload.createdBy, journalEntryError.InvalidValue);
  helpers.validateSourceType(payload.sourceType);
  helpers.validateCounterpartyId(payload.sourceType, payload.counterPartyId);
  helpers.validateStatus(payload.status);
  dateUtils.validateDate(payload.effectiveDate, journalEntryError.InvalidValue);
  helpers.validatePostedAt(payload.postedAt);
  helpers.validateVoidedAt(payload.voidedAt);
  helpers.validateVoidingEntryId(payload.voidingEntryId);

  const id = generateUUID();
  const timestamp = new Date();
  const memo = helpers.getMemo(payload.memo);

  const linesWithEvents = payload.lines.map((item) =>
    journalLineEntity.make({ id, memo, createdAt: timestamp }, item)
  );

  const lines = linesWithEvents.map(([item]) => item);
  helpers.validateLine(lines);

  const entry: IJournalEntry = {
    id,
    accountingEntityId: payload.accountingEntityId,
    sourceType: payload.sourceType,
    counterPartyId: payload.counterPartyId,
    lines,
    memo,
    status: payload.status,
    effectiveDate: payload.effectiveDate,
    postedAt: payload.postedAt,
    voidedAt: payload.voidedAt,
    voidingEntryId: payload.voidingEntryId,
    version: 1,
    createdBy: payload.createdBy,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const events = linesWithEvents.flatMap(([, event]) => event);
  const entityEvent = journalEntryEvents.created(entry);

  return [Object.freeze(entry), [entityEvent, ...events]];
}

const journalEntryEntity = Object.freeze({
  make,

  ...helpers,
});

export default journalEntryEntity;
