import { TEntityId } from '../../../shared/types/uuid';
import { ICurrency } from '../../currency/types/currency.types';
import { IJournalLine, IJournalLineMakePayload } from './journal-line.types';

export const EJournalEntrySourceType = {
  Sale: 'sale',
  Purchase: 'purchase',
  CreditNote: 'credit_note',
  DebitNote: 'debit_note',
  Expense: 'expense',
  Transfer: 'transfer',
  Payment: 'payment',
  Receipt: 'receipt',
  Adjustment: 'adjustment',
  System: 'system',
  OpeningBalance: 'opening_balance',
} as const;

export type UJournalEntrySourceType =
  (typeof EJournalEntrySourceType)[keyof typeof EJournalEntrySourceType];

export const EJournalEntryStatus = {
  Draft: 'draft',
  Posted: 'posted',
  Voided: 'voided',
  Archived: 'archived',
} as const;

export type UJournalEntryStatus =
  (typeof EJournalEntryStatus)[keyof typeof EJournalEntryStatus];

export interface IJournalEntry {
  id: TEntityId;
  accountingEntityId: TEntityId;
  sourceType: UJournalEntrySourceType;
  counterPartyId: TEntityId | null;
  lines: IJournalLine[];
  memo: string | null;
  status: UJournalEntryStatus;
  effectiveDate: Date;
  postedAt: Date | null;
  voidedAt: Date | null;
  voidingEntryId: TEntityId | null;
  version: number;
  createdBy: TEntityId;
  createdAt: Date;
  updatedAt: Date;
}

export type IJournalHeader = Omit<IJournalEntry, 'lines'>;

export interface IjournalEntryMakePayload extends Pick<
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
