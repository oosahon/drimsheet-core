import { IMoney } from '../../../shared/types/money.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IExchangeRate } from '../../currency/types/exchange-rate.types';

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

// TODO: review statuses
export const ETransactionStatus = {
  Pending: 'pending',
  Posted: 'posted',
  Voided: 'voided',
  Archived: 'archived',
} as const;

export type UTransactionStatus =
  (typeof ETransactionStatus)[keyof typeof ETransactionStatus];

export interface ITransactionLineItem {
  id: TEntityId;
  transactionId: TEntityId;
  targetAccountId: TEntityId;
  amount: IMoney;
  functionalAmount: IMoney;
  counterPartyId: TEntityId | null; // null for transfers
  description: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ITransactionAttachment {
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
  items: ITransactionLineItem[];
  effectiveDate: Date;
  createdBy: TEntityId;
  sourceAccountId: TEntityId;
  amount: IMoney;
  exchangeRate: IExchangeRate; // for explicitness
  functionalAmount: IMoney;
  attachments: ITransactionAttachment[];
  notes: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export const ETransactionHistoryLogAction = {
  Created: 'created',
  Updated: 'updated',
  Voided: 'voided',
  Posted: 'posted',
  Archived: 'archived',
  Unarchived: 'unarchived',
} as const;

export type UTransactionHistoryLogAction =
  (typeof ETransactionHistoryLogAction)[keyof typeof ETransactionHistoryLogAction];

export interface ITransactionHistoryLog {
  // NB: serial will be generated in the persistence layer
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
