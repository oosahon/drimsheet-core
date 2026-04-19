import { IMoney } from '../../../shared/types/money.types';
import { TEntityId } from '../../../shared/types/uuid';

const EEJournalEntrySide = {
  Debit: 'debit',
  Credit: 'credit',
} as const;

type UJournalEntrySide =
  (typeof EEJournalEntrySide)[keyof typeof EEJournalEntrySide];

interface IJournalLineItemMeta extends Record<
  string,
  string | object | boolean | null
> {}

interface IJournalLineItem {
  id: TEntityId;
  accountId: TEntityId;
  sequenceOrder: number;
  amount: IMoney;
  exchangeRate: number;
  functionalAmount: IMoney; // derived from amount and exchangeRate
  side: UJournalEntrySide;
  description?: string;
  meta?: IJournalLineItemMeta;
}

const EJournalEntryStatus = {
  Draft: 'draft',
  Posted: 'posted',
  Voided: 'voided',
} as const;

type UJournalEntryStatus =
  (typeof EJournalEntryStatus)[keyof typeof EJournalEntryStatus];

export interface IJournalEntry {
  id: TEntityId;
  transactionId: TEntityId;
  version: number;
  accountingEntityId: TEntityId;
  lineItems: IJournalLineItem[];
  memo: string;
  status: UJournalEntryStatus;
  effectiveDate: Date; // the actual date the transaction occurred
  postedAt: Date | null;
  voidedAt: Date | null;
  voidedByJournalEntryId: TEntityId | null;
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
