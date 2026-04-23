import { TEntityId } from '../../../shared/types/uuid';
import { IJournalLineItem } from './journal-line-item.types';

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
  lineItems: IJournalLineItem[];
  memo: string;
  status: UJournalEntryStatus;
  effectiveDate: Date; // the actual date the transaction occurred
  postedAt: Date | null;
  voidedAt: Date | null;
  voidedByJournalEntryId: TEntityId | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
