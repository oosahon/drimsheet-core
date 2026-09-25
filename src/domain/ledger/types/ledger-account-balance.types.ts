import { TEntityId } from '@shared/types/uuid';

import { IMoney } from '@domain/money/types/money.types';

export interface ILedgerAccountBalance {
  createdBy: TEntityId;
  ledgerAccountId: TEntityId;
  accountingEntityId: TEntityId;
  accountMaterializedPath: string;
  amount: IMoney;
  functionalAmount: IMoney;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export const ELedgerAccountBalanceEffect = {
  Increase: 'increase',
  Decrease: 'decrease',
  Noop: 'noop',
} as const;

export type ULedgerAccountBalanceEffect =
  (typeof ELedgerAccountBalanceEffect)[keyof typeof ELedgerAccountBalanceEffect];

export interface ILedgerAccountBalanceAdjustment {
  id: TEntityId;
  ledgerAccountId: TEntityId;
  amount: IMoney;
  functionalAmount: IMoney;
  journalEntryId: TEntityId;
  effect: ULedgerAccountBalanceEffect;
  createdBy: TEntityId;
  createdAt: Date;
}

export interface INewLedgerAccountBalanceAndAdjustment {
  newBalance: ILedgerAccountBalance;
  adjustment: ILedgerAccountBalanceAdjustment;
}
