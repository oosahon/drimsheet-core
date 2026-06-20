import dateUtils from '../../../shared/utils/date';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import journalEntryError from '../errors/journal-entry.error';
import journalEntryEvents from '../events/journal-entry.events';
import {
  EJournalEntryAuditAction,
  TAuditedJournalEntry,
} from '../types/journal-entry-audit.types';
import {
  IJournalEntry,
  IJournalHeader,
  IjournalEntryMakePayload,
} from '../types/journal-entry.types';
import journalEntryAudit from '../value-objects/journal-entry-audit.vo';
import helpers from './helpers/journal-entry.entity.helpers';
import journalLineEntity from './journal-line.entity';

function make(payload: IjournalEntryMakePayload): TAuditedJournalEntry {
  stringUtils.validateUUID(
    payload.accountingEntityId,
    journalEntryError.InvalidValue
  );
  stringUtils.validateUUID(payload.createdBy, journalEntryError.InvalidValue);
  helpers.validateSourceType(payload.sourceType);
  helpers.validateCounterpartyId(payload.sourceType, payload.counterPartyId);
  helpers.validateStatus(payload.status);
  dateUtils.validateDate(
    payload.effectiveDate,
    journalEntryError.InvalidEffectiveDate
  );
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
  const lineAudits = linesWithEvents.map(([, , audit]) => audit);
  const entityEvent = journalEntryEvents.created(entry);
  const { lines: _lines, ...header } = entry;
  const headerAudit = journalEntryAudit.make({
    before: null,
    after: header as IJournalHeader,
    action: EJournalEntryAuditAction.Created,
  });

  return [
    Object.freeze(entry),
    [entityEvent, ...events],
    {
      header: headerAudit,
      lines: lineAudits,
    },
  ];
}

const journalEntryEntity = Object.freeze({
  make,

  ...helpers,
});

export default journalEntryEntity;
