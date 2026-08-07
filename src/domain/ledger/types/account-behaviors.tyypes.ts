import { EAssetAccountBehavior } from '../asset-account/types/asset-account.types';
import { EEquityAccountBehavior } from '../equity-account/types/equity-account.types';
import { EExpenseAccountBehavior } from '../expense-account/types/expense-account.types';
import { ELiabilityAccountBehavior } from '../liability-account/types/liability-account.types';
import { ERevenueAccountBehavior } from '../revenue-account/types/revenue-account.types';
import { ESuspenseBehavior } from './suspense-account.types';

export const ELedgerAccountBehavior = {
  ...EAssetAccountBehavior,
  ...ELiabilityAccountBehavior,
  ...EEquityAccountBehavior,
  ...ERevenueAccountBehavior,
  ...EExpenseAccountBehavior,
  ...ESuspenseBehavior,
} as const;

export type ULedgerAccountBehavior =
  (typeof ELedgerAccountBehavior)[keyof typeof ELedgerAccountBehavior];
