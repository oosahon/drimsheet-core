import { TEntityId } from '../../../shared/types/uuid';
import { ICurrency } from '../../money/types/currency.types';
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

export interface IJournalHeader {
  id: TEntityId;
  accountingEntityId: TEntityId;
  sourceType: UJournalEntrySourceType;
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

export interface IJournalEntry extends IJournalHeader {
  lines: IJournalLine[];
}

export interface IJournalEntryMakePayload extends Pick<
  IJournalEntry,
  | 'accountingEntityId'
  | 'sourceType'
  | 'effectiveDate'
  | 'postedAt'
  | 'memo'
  | 'createdBy'
> {
  functionalCurrency: ICurrency;
  lines: IJournalLineMakePayload[];
}

export interface IVoidJournalEntryPayload {
  voidingEntryId: TEntityId;
}
