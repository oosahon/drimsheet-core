import { TEntityId } from '../../../shared/types/uuid';
import { IJournalEntry } from './journal-entry.types';

export const EJournalEntryHistoryLogAction = {
  Created: 'created',
  Updated: 'updated',
  Voided: 'voided',
  Posted: 'posted',
  Archived: 'archived',
  Unarchived: 'unarchived',
} as const;

export type UJournalEntryHistoryLogAction =
  (typeof EJournalEntryHistoryLogAction)[keyof typeof EJournalEntryHistoryLogAction];

export interface IJournalEntryHistoryLog {
  id: number; // using serials for db performance
  journalEntryId: TEntityId;
  userId: TEntityId;
  action: UJournalEntryHistoryLogAction;
  diff: {
    before: Partial<IJournalEntry>;
    after: Partial<IJournalEntry>;
  };
  note?: string;
  createdAt: Date;
}
