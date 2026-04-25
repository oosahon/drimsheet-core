import { TEntityId } from '../../../shared/types/uuid';

export interface ILedgerAccountBalance {
  ledgerAccountId: TEntityId;
  currencyCode: string;
  amount: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export const EBalanceEffect = {
  Increase: 'increase',
  Decrease: 'decrease',
  NoChange: 'no_change',
} as const;

export type UBalanceEffect =
  (typeof EBalanceEffect)[keyof typeof EBalanceEffect];

export interface ILedgerAccountBalanceAdjustment {
  id: TEntityId;
  ledgerAccountId: TEntityId;
  currencyCode: string;
  amount: number;
  journalEntryId: TEntityId;
  transactionId: TEntityId | null;
  effect: UBalanceEffect;
  createdBy: TEntityId;
  createdAt: Date;
}
