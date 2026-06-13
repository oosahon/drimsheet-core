import { IHistory } from '../../../shared/types/history.types';
import { IJournalEntry } from './journal-entry.types';

export const EJournalEntryHistoryAction = {
  Created: 'created',
  Updated: 'updated',
  Voided: 'voided',
  Posted: 'posted',
  Archived: 'archived',
  Unarchived: 'unarchived',
} as const;

export type UJournalEntryHistoryAction =
  (typeof EJournalEntryHistoryAction)[keyof typeof EJournalEntryHistoryAction];

export interface IJournalEntryHistory extends IHistory<IJournalEntry> {}
