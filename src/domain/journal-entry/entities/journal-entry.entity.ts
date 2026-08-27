import dateUtils from '@shared/utils/date';
import stringUtils from '@shared/utils/string';
import generateUUID from '@shared/utils/uuid-generator';
import fileAttachmentValue from '@shared/values/file-attachments/file-attachment.vo';
import { IFileAttachment } from '@shared/values/file-attachments/types/file-attachment.types';

import helpers from '@domain/journal-entry/entities/helpers/journal-entry.entity.helpers';
import journalEntryError from '@domain/journal-entry/errors/journal-entry.error';
import journalEntryEvents from '@domain/journal-entry/events/journal-entry.events';
import {
  EJournalEntryAuditAction,
  TAuditedJournalEntry,
  TAuditedJournalEntryTransition,
} from '@domain/journal-entry/types/journal-entry-audit.types';
import {
  EJournalEntryStatus,
  IJournalEntry,
  IJournalEntryMakePayload,
  IJournalHeader,
  IVoidJournalEntryPayload,
} from '@domain/journal-entry/types/journal-entry.types';
import journalEntryAudit from '@domain/journal-entry/values/journal-entry-audit.vo';

import journalLineEntity from './journal-line.entity';

function make(payload: IJournalEntryMakePayload): TAuditedJournalEntry {
  stringUtils.validateUUID(
    payload.accountingEntityId,
    journalEntryError.InvalidValue
  );
  stringUtils.validateUUID(payload.createdBy, journalEntryError.InvalidValue);
  helpers.validateSourceType(payload.sourceType);
  dateUtils.validateDate(
    payload.effectiveDate,
    journalEntryError.InvalidEffectiveDate
  );
  const id = generateUUID();
  const timestamp = new Date();
  const memo = helpers.getMemo(payload.memo);

  helpers.validatePostedAt(payload.postedAt);

  const linesWithEvents = payload.lines.map((item) =>
    journalLineEntity.make({ id, memo, createdAt: timestamp }, item)
  );

  const lines = linesWithEvents.map(([item]) => item);

  helpers.validateLine(lines);
  helpers.validateCounterparties(payload.sourceType, lines);

  const rawAttachments = (payload.attachments ?? []).map(
    fileAttachmentValue.make
  );
  const attachments = Object.freeze(rawAttachments) as IFileAttachment[];

  const status = payload.postedAt
    ? EJournalEntryStatus.Posted
    : EJournalEntryStatus.Draft;

  const entry: IJournalEntry = {
    id,
    accountingEntityId: payload.accountingEntityId,
    sourceType: payload.sourceType,
    lines,
    attachments,
    memo,
    status,
    effectiveDate: payload.effectiveDate,
    postedAt: payload.postedAt,
    voidedAt: null,
    voidingEntryId: null,
    version: 1,
    createdBy: payload.createdBy,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const events = linesWithEvents.flatMap(([, event]) => event);
  const lineAudits = linesWithEvents.map(([, , audit]) => audit);
  const entityEvent = journalEntryEvents.created(entry);
  const { lines: _lines, attachments: _attachments, ...header } = entry;
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

function voidEntry(
  entry: IJournalEntry,
  payload: IVoidJournalEntryPayload
): TAuditedJournalEntryTransition {
  helpers.validateTransition(entry.status, EJournalEntryStatus.Voided, [
    EJournalEntryStatus.Posted,
  ]);
  helpers.validateVoidingEntryId(payload.voidingEntryId);

  const timestamp = new Date();
  const voidedEntry = makeTransitionedEntry(
    entry,
    EJournalEntryStatus.Voided,
    timestamp,
    timestamp,
    payload.voidingEntryId
  );
  const event = journalEntryEvents.voided(voidedEntry);
  const { lines: _l1, attachments: _att1, ...header } = voidedEntry;
  const { lines: _l2, attachments: _att2, ...beforeHeader } = entry;
  const audit = journalEntryAudit.make({
    before: beforeHeader,
    after: header,
    action: EJournalEntryAuditAction.Voided,
  });

  return [voidedEntry, [event], audit];
}

function archive(entry: IJournalEntry): TAuditedJournalEntryTransition {
  helpers.validateTransition(entry.status, EJournalEntryStatus.Archived, [
    EJournalEntryStatus.Draft,
    EJournalEntryStatus.Posted,
  ]);

  const timestamp = new Date();
  const archivedEntry = makeTransitionedEntry(
    entry,
    EJournalEntryStatus.Archived,
    timestamp,
    entry.voidedAt,
    entry.voidingEntryId
  );
  const event = journalEntryEvents.archived(archivedEntry);
  const { lines: _l1, attachments: _att1, ...header } = archivedEntry;
  const { lines: _l2, attachments: _att2, ...beforeHeader } = entry;
  const audit = journalEntryAudit.make({
    before: beforeHeader,
    after: header,
    action: EJournalEntryAuditAction.Archived,
  });

  return [archivedEntry, [event], audit];
}

function makeTransitionedEntry(
  entry: IJournalEntry,
  status: IJournalEntry['status'],
  updatedAt: Date,
  voidedAt: Date | null,
  voidingEntryId: IJournalEntry['voidingEntryId']
) {
  return Object.freeze({
    id: entry.id,
    accountingEntityId: entry.accountingEntityId,
    sourceType: entry.sourceType,
    lines: entry.lines,
    attachments: entry.attachments,
    memo: entry.memo,
    status,
    effectiveDate: entry.effectiveDate,
    postedAt: entry.postedAt,
    voidedAt,
    voidingEntryId,
    version: entry.version + 1,
    createdBy: entry.createdBy,
    createdAt: entry.createdAt,
    updatedAt,
  });
}

const journalEntryEntity = Object.freeze({
  make,
  void: voidEntry,
  archive,

  ...helpers,
});

export default journalEntryEntity;
