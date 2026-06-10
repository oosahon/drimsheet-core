import { EAssetSubType } from './asset-account.types';
import { EEquitySubType } from './equity-account.types';
import { EExpenseSubType } from './expense-account.types';
import { ELiabilitySubType } from './liability-account.types';
import { ERevenueSubType } from './revenue-account.types';

export const ELedgerAccountSubType = {
  ...EAssetSubType,
  ...ELiabilitySubType,
  ...EEquitySubType,
  ...ERevenueSubType,
  ...EExpenseSubType,
} as const;

export type ULedgerAccountSubType =
  (typeof ELedgerAccountSubType)[keyof typeof ELedgerAccountSubType];
