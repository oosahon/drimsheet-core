import { IMoney } from '../../../shared/types/money.types';
import { TEntityId } from '../../../shared/types/uuid';

export const ETransactionType = {
  Sale: 'sale',
  Purchase: 'purchase',
  CreditNote: 'credit_note',
  DebitNote: 'debit_note',
  Expense: 'expense',
  Transfer: 'transfer',
  Payment: 'payment',
  Receipt: 'receipt',
} as const;

export type UTransactionType =
  (typeof ETransactionType)[keyof typeof ETransactionType];

export const ETransactionStatus = {
  Pending: 'pending',
  Posted: 'posted',
  Voided: 'voided',
  Archived: 'archived',
} as const;

export type UTransactionStatus =
  (typeof ETransactionStatus)[keyof typeof ETransactionStatus];

export interface ITransactionItem {
  id: TEntityId;
  description: string;
  amount: IMoney;
  functionalCurrencyAmount: IMoney;
  transactionId: TEntityId;
  categoryId: TEntityId;
  accountId: TEntityId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface ITransactionAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface ITransaction {
  id: TEntityId;
  accountingEntityId: TEntityId;
  reference: string;
  type: UTransactionType;
  status: UTransactionStatus;
  effectiveDate: Date;
  createdBy: TEntityId;
  sourceAccountId: TEntityId;
  amount: IMoney;
  functionalCurrencyAmount: IMoney; // simplifies reporting calculations
  exchangeRate: number; // for explicitness
  attachments: ITransactionAttachment[];
  counterPartyId: TEntityId | null; // null for transfers
  items: ITransactionItem[];
  notes: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const ETransactionHistoryLogAction = {
  Created: 'created',
  Updated: 'updated',
  Voided: 'voided',
  Posted: 'posted',
  Archived: 'archived',
  Unarchived: 'unarchived',
} as const;

type UTransactionHistoryLogAction =
  (typeof ETransactionHistoryLogAction)[keyof typeof ETransactionHistoryLogAction];

export interface ITransactionHistoryLog {
  id: number; // using serials for db performance
  transactionId: TEntityId;
  userId: TEntityId;
  action: UTransactionHistoryLogAction;
  diff: {
    before: Partial<ITransaction>;
    after: Partial<ITransaction>;
  };
  note?: string;
  createdAt: Date;
}
