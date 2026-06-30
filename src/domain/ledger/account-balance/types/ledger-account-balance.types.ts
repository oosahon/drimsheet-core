import { IMoney } from '../../../../shared/types/money.types';
import { TEntityId } from '../../../../shared/types/uuid';

export interface ILedgerAccountBalance {
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

// TODO: check if it is being used. Delete if not
export interface INewLedgerAccountBalanceAndAdjustment {
  newBalance: ILedgerAccountBalance;
  adjustment: ILedgerAccountBalanceAdjustment;
}
