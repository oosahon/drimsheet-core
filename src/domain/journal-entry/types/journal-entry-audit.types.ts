import { IEvent } from '../../../shared/types/event.types';
import { IEntityDelta, IHistory } from '../../../shared/types/history.types';
import { IJournalEntry, IJournalHeader } from './journal-entry.types';
import { IJournalLine } from './journal-line.types';

export const EJournalEntryAuditAction = {
  Created: 'created',
  Updated: 'updated',
  Voided: 'voided',
  Posted: 'posted',
  Archived: 'archived',
  Unarchived: 'unarchived',
} as const;

export type UJournalEntryAuditAction =
  (typeof EJournalEntryAuditAction)[keyof typeof EJournalEntryAuditAction];

export interface IJournalEntryAudit extends IEntityDelta<IJournalHeader> {
  action: UJournalEntryAuditAction;
}

export interface IMakeJournalEntryAuditPayload {
  before: IJournalHeader | null;
  after: IJournalHeader;
  action: UJournalEntryAuditAction;
}

export interface IJournalEntryHistory extends IHistory<IJournalHeader> {}

export const EJournalLineAuditAction = {
  Created: 'created',
  Updated: 'updated',
  Deleted: 'deleted',
} as const;

export type UJournalLineAuditAction =
  (typeof EJournalLineAuditAction)[keyof typeof EJournalLineAuditAction];

export interface IJournalLineAudit extends IEntityDelta<IJournalLine> {
  action: UJournalLineAuditAction;
}

export interface IMakeJournalLineAuditPayload {
  before: IJournalLine | null;
  after: IJournalLine;
  action: UJournalLineAuditAction;
}

export interface IJournalLineHistory extends IHistory<IJournalLine> {}

export type TAuditedJournalEntry = [
  IJournalEntry,
  IEvent<IJournalEntry | IJournalLine>[],
  {
    header: IJournalEntryAudit;
    lines: IJournalLineAudit[];
  },
];
