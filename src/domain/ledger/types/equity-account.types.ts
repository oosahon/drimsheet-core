import { ELedgerType, ILedgerAccount } from './ledger.types';
import {
  TEquityLedgerCode,
  TCapitalLedgerCode,
  TRetainedEarningsLedgerCode,
  TReservesLedgerCode,
  TOpeningBalanceEquityLedgerCode,
} from './ledger-code.types';
import { EAdjunctAccountRule, EContraAccountRule } from './ledger.types';

export const EEquitySubType = {
  Capital: 'capital',
  RetainedEarnings: 'retained_earnings',
  Reserve: 'reserve',
  OpeningBalance: 'opening_balance',
} as const;

export type UEquitySubType =
  (typeof EEquitySubType)[keyof typeof EEquitySubType];

export const EEquityAccountBehavior = {
  OwnerCapital: 'owner_capital',
  RetainedEarnings: 'retained_earnings',
  RevaluationReserve: 'revaluation_reserve',
  OpeningBalanceEquity: 'opening_balance_equity',
} as const;

export type UEquityAccountBehavior =
  (typeof EEquityAccountBehavior)[keyof typeof EEquityAccountBehavior];

export interface IEquityLedgerAccount extends ILedgerAccount {
  code: TEquityLedgerCode;
  type: typeof ELedgerType.Equity;
  subType: UEquitySubType;
  behavior: UEquityAccountBehavior;
}

/**
 * =============== Capital ===============
 * code: 300xxx
 */
export interface ICapitalAccount extends IEquityLedgerAccount {
  code: TCapitalLedgerCode;
  subType: typeof EEquitySubType.Capital;
  behavior: typeof EEquityAccountBehavior.OwnerCapital;
  contraAccountRule: typeof EContraAccountRule.ContraPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctPermitted;
}

/**
 * =============== Retained Earnings ===============
 * code: 301xxx
 */
export interface IRetainedEarningsAccount extends IEquityLedgerAccount {
  code: TRetainedEarningsLedgerCode;
  subType: typeof EEquitySubType.RetainedEarnings;
  behavior: typeof EEquityAccountBehavior.RetainedEarnings;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Reserves ===============
 * code: 302xxx
 */
export interface IRevaluationReserveAccount extends IEquityLedgerAccount {
  code: TReservesLedgerCode;
  subType: typeof EEquitySubType.Reserve;
  behavior: typeof EEquityAccountBehavior.RevaluationReserve;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Opening Balance Equity ===============
 * code: 399xxx
 */
export interface IOpeningBalanceEquityAccount extends IEquityLedgerAccount {
  code: TOpeningBalanceEquityLedgerCode;
  subType: typeof EEquitySubType.OpeningBalance;
  behavior: typeof EEquityAccountBehavior.OpeningBalanceEquity;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}
