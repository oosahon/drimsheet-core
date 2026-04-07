import {
  TAssetSuspenseLedgerCode,
  TLiabilitySuspenseLedgerCode,
} from './ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ILedgerAccount,
} from './ledger.types';

export const ESuspenseSubType = {
  Suspense: 'suspense',
} as const;

export type TSuspenseSubType =
  (typeof ESuspenseSubType)[keyof typeof ESuspenseSubType];

export const ESuspenseBehavior = {
  Default: 'default',
} as const;

export type TSuspenseBehavior =
  (typeof ESuspenseBehavior)[keyof typeof ESuspenseBehavior];

export interface ISuspenseLedgerAccount extends ILedgerAccount {
  code: TAssetSuspenseLedgerCode | TLiabilitySuspenseLedgerCode;
  subType: TSuspenseSubType;
  behavior: TSuspenseBehavior;
  isControlAccount: false;
  controlAccountId: null;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
  meta: null; // NB: this may change as we add functionalities
}
