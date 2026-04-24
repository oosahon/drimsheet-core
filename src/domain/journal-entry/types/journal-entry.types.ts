import { TEntityId } from '../../../shared/types/uuid';
import { IJournalLine } from './journal-line.types';

export const EJournalEntryStatus = {
  Draft: 'draft',
  Posted: 'posted',
  Voided: 'voided',
} as const;

export type UJournalEntryStatus =
  (typeof EJournalEntryStatus)[keyof typeof EJournalEntryStatus];

export interface IJournalEntry {
  id: TEntityId;
  accountingEntityId: TEntityId;
  transactionId: TEntityId | null; // non for manual entries and opening balances
  lineItems: IJournalLine[];
  memo: string | null;
  status: UJournalEntryStatus;
  effectiveDate: Date; // the actual date the transaction occurred
  postedAt: Date | null;
  voidedAt: Date | null;
  voidingEntryId: TEntityId | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
