import { ELedgerType, ILedgerAccount } from './ledger.types';
import {
  TRevenueLedgerCode,
  TSalesLedgerCode,
  TServicesLedgerCode,
  TSubscriptionsLedgerCode,
  TEmploymentIncomeLedgerCode,
  TInterestIncomeLedgerCode,
  TGainOnSaleLedgerCode,
  TUnrealizedGainLedgerCode,
} from './ledger-code.types';
import { EAdjunctAccountRule, EContraAccountRule } from './ledger.types';

export const ERevenueSubType = {
  Sales: 'sales',
  Services: 'services',
  Subscriptions: 'subscriptions',
  EmploymentIncome: 'employment_income',
  InterestIncome: 'interest_income',
  GainOnSale: 'gain_on_sale',
  UnrealizedGains: 'unrealized_gains',
} as const;

export type URevenueSubType =
  (typeof ERevenueSubType)[keyof typeof ERevenueSubType];

export const ERevenueAccountBehavior = {
  Sales: 'sales',
  Services: 'services',
  Subscriptions: 'subscriptions',
  EmploymentIncome: 'employment_income',
  InterestIncome: 'interest_income',
  GainOnSale: 'gain_on_sale',
  UnrealizedGains: 'unrealized_gains',
} as const;

export type URevenueAccountBehavior =
  (typeof ERevenueAccountBehavior)[keyof typeof ERevenueAccountBehavior];

export interface IRevenueLedgerAccount extends ILedgerAccount {
  code: TRevenueLedgerCode;
  type: typeof ELedgerType.Revenue;
  subType: URevenueSubType;
  behavior: URevenueAccountBehavior;
}

/**
 * =============== Sales ===============
 * code: 400xxx
 */
export interface ISalesAccount extends IRevenueLedgerAccount {
  code: TSalesLedgerCode;
  subType: typeof ERevenueSubType.Sales;
  behavior: typeof ERevenueAccountBehavior.Sales;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctPermitted;
}

/**
 * =============== Services ===============
 * code: 401xxx
 */
export interface IServicesAccount extends IRevenueLedgerAccount {
  code: TServicesLedgerCode;
  subType: typeof ERevenueSubType.Services;
  behavior: typeof ERevenueAccountBehavior.Services;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Subscriptions ===============
 * code: 402xxx
 */
export interface ISubscriptionsAccount extends IRevenueLedgerAccount {
  code: TSubscriptionsLedgerCode;
  subType: typeof ERevenueSubType.Subscriptions;
  behavior: typeof ERevenueAccountBehavior.Subscriptions;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Employment Income ===============
 * code: 403xxx
 */
export interface IEmploymentIncomeAccount extends IRevenueLedgerAccount {
  code: TEmploymentIncomeLedgerCode;
  subType: typeof ERevenueSubType.EmploymentIncome;
  behavior: typeof ERevenueAccountBehavior.EmploymentIncome;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Interest Income ===============
 * code: 404xxx
 */
export interface IInterestIncomeAccount extends IRevenueLedgerAccount {
  code: TInterestIncomeLedgerCode;
  subType: typeof ERevenueSubType.InterestIncome;
  behavior: typeof ERevenueAccountBehavior.InterestIncome;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Gain on Sale of Assets ===============
 * code: 405xxx
 */
export interface IGainOnSaleAccount extends IRevenueLedgerAccount {
  code: TGainOnSaleLedgerCode;
  subType: typeof ERevenueSubType.GainOnSale;
  behavior: typeof ERevenueAccountBehavior.GainOnSale;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Unrealized Gains ===============
 * code: 406xxx
 */
export interface IUnrealizedGainAccount extends IRevenueLedgerAccount {
  code: TUnrealizedGainLedgerCode;
  subType: typeof ERevenueSubType.UnrealizedGains;
  behavior: typeof ERevenueAccountBehavior.UnrealizedGains;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}
