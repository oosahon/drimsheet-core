import { IMoney } from '../../../shared/types/money.types';
import { TEntityId } from '../../../shared/types/uuid';

export const EEJournalEntrySide = {
  Debit: 'debit',
  Credit: 'credit',
} as const;

export type UJournalEntrySide =
  (typeof EEJournalEntrySide)[keyof typeof EEJournalEntrySide];

interface IJournalLineItemMeta extends Record<
  string,
  string | object | boolean | null
> {}

export interface IJournalLineItem {
  id: TEntityId;
  entryId: TEntityId;
  accountId: TEntityId;
  sequenceOrder: number;
  amount: IMoney;
  exchangeRate: number;
  functionalAmount: IMoney; // derived from amount and exchangeRate
  side: UJournalEntrySide;
  description?: string;
  meta?: IJournalLineItemMeta;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

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
  transactionId: TEntityId;
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

const EJournalEntryHistoryLogAction = {
  Created: 'created',
  Updated: 'updated',
  Voided: 'voided',
  Posted: 'posted',
} as const;

type UJournalEntryHistoryLogAction =
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
