import {
  TAdminGeneralLedgerCode,
  TAssetDisposalLossLedgerCode,
  TBankChargeLedgerCode,
  TDepreciationAmortizationLedgerCode,
  TDirectCostsLedgerCode,
  TExpenseLedgerCode,
  TFinanceCostLedgerCode,
  TImpairmentLossLedgerCode,
  TIncomeTaxLedgerCode,
  TInterestLedgerCode,
  TMarketingSellingLedgerCode,
  TOtherLossLedgerCode,
  TPayrollLedgerCode,
  TRentUtilitiesLedgerCode,
  TResearchDevLedgerCode,
  TUnrealizedLossLedgerCode,
} from './ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerType,
  ILedgerAccount,
} from './ledger.types';

export const EExpenseSubType = {
  DirectCosts: 'direct_costs',
  PayrollAndPersonnel: 'payroll_and_personnel',
  RentAndUtilities: 'rent_and_utilities',
  AdminAndGeneral: 'admin_and_general',
  MarketingAndSelling: 'marketing_and_selling',
  ResearchAndDevelopment: 'research_and_development',
  DepreciationAndAmortization: 'depreciation_and_amortization',
  BankCharge: 'bank_charge',
  FinanceCost: 'finance_cost',
  Interest: 'interest',
  IncomeTaxExpense: 'income_tax_expense',
  UnrealizedLoss: 'unrealized_loss',
  LossOnAssetDisposal: 'loss_on_asset_disposal',
  ImpairmentLoss: 'impairment_loss',
  OtherLoss: 'other_loss',
} as const;

export type UExpenseSubType =
  (typeof EExpenseSubType)[keyof typeof EExpenseSubType];

const EDirectCostsBehavior = {
  COGS: 'cogs',
  CostOfServices: 'cost_of_services',
  CostOfRevenue: 'cost_of_revenue',
  DefaultDirectCost: 'default_direct_cost',
} as const;

type UDirectCostsBehavior =
  (typeof EDirectCostsBehavior)[keyof typeof EDirectCostsBehavior];

const EOpexBehavior = {
  PayrollAndPersonnel: 'payroll_and_personnel',
  RentAndUtilities: 'rent_and_utilities',
  AdminAndGeneral: 'admin_and_general',
  MarketingAndSelling: 'marketing_and_selling',
  ResearchAndDevelopment: 'research_and_development',
  DepreciationAndAmortization: 'depreciation_and_amortization',
} as const;

const ENonOperatingExpenseBehavior = {
  BankCharge: 'bank_charge',
  FinanceCost: 'finance_cost',
  Interest: 'interest',
  TaxExpense: 'tax_expense',
} as const;

const ELossBehavior = {
  UnrealizedLoss: 'unrealized_loss',
  AssetDisposalLoss: 'asset_disposal_loss',
  ImpairmentLoss: 'impairment_loss',
  OtherLoss: 'other_loss',
} as const;

export const EExpenseAccountBehavior = {
  ...EDirectCostsBehavior,
  ...EOpexBehavior,
  ...ENonOperatingExpenseBehavior,
  ...ELossBehavior,
  Default: 'default',
} as const;

export type UExpenseAccountBehavior =
  (typeof EExpenseAccountBehavior)[keyof typeof EExpenseAccountBehavior];

export interface IExpenseLedgerAccount extends ILedgerAccount {
  code: TExpenseLedgerCode;
  type: typeof ELedgerType.Expense;
  subType: UExpenseSubType;
  behavior: UExpenseAccountBehavior;
}

/**
 * =============== Direct Costs ===============
 * code: 500xxx
 */
export interface IDirectCostsAccount extends IExpenseLedgerAccount {
  code: TDirectCostsLedgerCode;
  subType: typeof EExpenseSubType.DirectCosts;
  behavior: UDirectCostsBehavior;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Payroll & Personnel ===============
 * code: 501xxx
 */
export interface IPayrollAccount extends IExpenseLedgerAccount {
  code: TPayrollLedgerCode;
  subType: typeof EExpenseSubType.PayrollAndPersonnel;
  behavior: typeof EOpexBehavior.PayrollAndPersonnel;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Rent & Utilities ===============
 * code: 502xxx
 */
export interface IRentUtilitiesAccount extends IExpenseLedgerAccount {
  code: TRentUtilitiesLedgerCode;
  subType: typeof EExpenseSubType.RentAndUtilities;
  behavior: typeof EOpexBehavior.RentAndUtilities;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Admin & General ===============
 * code: 503xxx
 */
export interface IAdminGeneralAccount extends IExpenseLedgerAccount {
  code: TAdminGeneralLedgerCode;
  subType: typeof EExpenseSubType.AdminAndGeneral;
  behavior: typeof EOpexBehavior.AdminAndGeneral;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Marketing & Selling ===============
 * code: 504xxx
 */
export interface IMarketingSellingAccount extends IExpenseLedgerAccount {
  code: TMarketingSellingLedgerCode;
  subType: typeof EExpenseSubType.MarketingAndSelling;
  behavior: typeof EOpexBehavior.MarketingAndSelling;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Research & Development ===============
 * code: 505xxx
 */
export interface IResearchDevAccount extends IExpenseLedgerAccount {
  code: TResearchDevLedgerCode;
  subType: typeof EExpenseSubType.ResearchAndDevelopment;
  behavior: typeof EOpexBehavior.ResearchAndDevelopment;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Depreciation & Amortization ===============
 * code: 506xxx
 */
export interface IDepreciationAmortizationAccount extends IExpenseLedgerAccount {
  code: TDepreciationAmortizationLedgerCode;
  subType: typeof EExpenseSubType.DepreciationAndAmortization;
  behavior: typeof EOpexBehavior.DepreciationAndAmortization;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Bank Charge ===============
 * code: 507xxx
 */
export interface IBankChargeAccount extends IExpenseLedgerAccount {
  code: TBankChargeLedgerCode;
  subType: typeof EExpenseSubType.BankCharge;
  behavior: typeof ENonOperatingExpenseBehavior.BankCharge;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Finance Cost ===============
 * code: 508xxx
 */
export interface IFinanceCostAccount extends IExpenseLedgerAccount {
  code: TFinanceCostLedgerCode;
  subType: typeof EExpenseSubType.FinanceCost;
  behavior: typeof ENonOperatingExpenseBehavior.FinanceCost;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Interest ===============
 * code: 509xxx
 */
export interface IInterestAccount extends IExpenseLedgerAccount {
  code: TInterestLedgerCode;
  subType: typeof EExpenseSubType.Interest;
  behavior: typeof ENonOperatingExpenseBehavior.Interest;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Income Tax Expense ===============
 * code: 510xxx
 */
export interface IIncomeTaxExpenseAccount extends IExpenseLedgerAccount {
  code: TIncomeTaxLedgerCode;
  subType: typeof EExpenseSubType.IncomeTaxExpense;
  behavior: typeof ENonOperatingExpenseBehavior.TaxExpense;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Unrealized Loss ===============
 * code: 511xxx
 */
export interface IUnrealizedLossAccount extends IExpenseLedgerAccount {
  code: TUnrealizedLossLedgerCode;
  subType: typeof EExpenseSubType.UnrealizedLoss;
  behavior: typeof ELossBehavior.UnrealizedLoss;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Loss on Asset Disposal ===============
 * code: 512xxx
 */
export interface IAssetDisposalLossAccount extends IExpenseLedgerAccount {
  code: TAssetDisposalLossLedgerCode;
  subType: typeof EExpenseSubType.LossOnAssetDisposal;
  behavior: typeof ELossBehavior.AssetDisposalLoss;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Impairment Loss ===============
 * code: 513xxx
 */
export interface IImpairmentLossAccount extends IExpenseLedgerAccount {
  code: TImpairmentLossLedgerCode;
  subType: typeof EExpenseSubType.ImpairmentLoss;
  behavior: typeof ELossBehavior.ImpairmentLoss;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Other Loss ===============
 * code: 514xxx
 */
export interface IOtherLossAccount extends IExpenseLedgerAccount {
  code: TOtherLossLedgerCode;
  subType: typeof EExpenseSubType.OtherLoss;
  behavior: typeof ELossBehavior.OtherLoss;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}
