import {
  TEmploymentIncomeLedgerCode,
  TGainOnAssetSaleLedgerCode,
  TGiftsLedgerCode,
  TGrantsLedgerCode,
  TInterestIncomeLedgerCode,
  TRevenueLedgerCode,
  TSalesLedgerCode,
  TServicesLedgerCode,
  TSubscriptionsLedgerCode,
  TUnrealizedGainLedgerCode,
} from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerType,
  ILedgerAccount,
} from '../../types/ledger.types';

export const ERevenueSubType = {
  Sales: 'sales',
  Services: 'services',
  Subscriptions: 'subscriptions',
  EmploymentIncome: 'employment_income',
  InterestIncome: 'interest_income',
  GainOnAssetSale: 'gain_on_asset_sale',
  UnrealizedGains: 'unrealized_gains',
  Grants: 'grants',
  Gifts: 'gifts',
} as const;

export type URevenueSubType =
  (typeof ERevenueSubType)[keyof typeof ERevenueSubType];

export const ERevenueAccountBehavior = {
  Sales: 'sales',
  Services: 'services',
  Subscriptions: 'subscriptions',
  EmploymentIncome: 'employment_income',
  InterestIncome: 'interest_income',
  GainOnAssetSale: 'gain_on_asset_sale',
  UnrealizedGains: 'unrealized_gains',
  Grants: 'grants',
  Gifts: 'gifts',
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
export interface IGainOnAssetSaleAccount extends IRevenueLedgerAccount {
  code: TGainOnAssetSaleLedgerCode;
  subType: typeof ERevenueSubType.GainOnAssetSale;
  behavior: typeof ERevenueAccountBehavior.GainOnAssetSale;
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

/**
 * =============== Grants ===============
 * code: 407xxx
 */
export interface IGrantsAccount extends IRevenueLedgerAccount {
  code: TGrantsLedgerCode;
  subType: typeof ERevenueSubType.Grants;
  behavior: typeof ERevenueAccountBehavior.Grants;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Gifts ===============
 * code: 408xxx
 */
export interface IGiftsAccount extends IRevenueLedgerAccount {
  code: TGiftsLedgerCode;
  subType: typeof ERevenueSubType.Gifts;
  behavior: typeof ERevenueAccountBehavior.Gifts;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}
