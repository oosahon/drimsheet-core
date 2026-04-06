import { ELedgerType, ILedgerAccount } from './ledger.types';
import {
  TLiabilityLedgerCode,
  TLiabilitySuspenseLedgerCode,
  TShortTermDebtLedgerCode,
  TPayablesLedgerCode,
  TAccruedExpenseLedgerCode,
  TDeferredRevenueLedgerCode,
  TLongTermLoanLedgerCode,
  TLeaseLiabilityLedgerCode,
  TProvisionLedgerCode,
} from './ledger-code.types';
import { EAdjunctAccountRule, EContraAccountRule } from './ledger.types';
import {
  ESuspenseSubType,
  ISuspenseLedgerAccount,
  TSuspenseSubType,
} from './suspense-account.types';
import { TEntityId } from '../../../shared/types/uuid';

export const ELiabilitySubType = {
  ShortTermDebt: 'short_term_debt',
  Payable: 'payable',
  AccruedExpense: 'accrued_expense',
  DeferredRevenue: 'deferred_revenue',
  LongTermLoan: 'long_term_loan',
  LeaseLiability: 'lease_liability',
  Provision: 'provision',
  Suspense: ESuspenseSubType.Suspense,
} as const;

export type ULiabilitySubType =
  (typeof ELiabilitySubType)[keyof typeof ELiabilitySubType];

export const EShortTermDebtBehavior = {
  CreditCard: 'credit_card',
  Overdraft: 'overdraft',
  ShortTermLoan: 'short_term_loan',
  DefaultShortTermDebt: 'default_short_term_debt',
} as const;

type UShortTermDebtBehavior =
  (typeof EShortTermDebtBehavior)[keyof typeof EShortTermDebtBehavior];

const EPayableBehavior = {
  TaxPayable: 'tax_payable',
  TradePayable: 'trade_payable',
  DefaultPayable: 'default_payable',
} as const;

type UPayableBehavior =
  (typeof EPayableBehavior)[keyof typeof EPayableBehavior];

const ELongTermLoanBehavior = {
  Mortgage: 'mortgage',
  OtherLongTermLoan: 'other_long_term_loan',
} as const;

type ULongTermLoanBehavior =
  (typeof ELongTermLoanBehavior)[keyof typeof ELongTermLoanBehavior];

export const ELiabilityAccountBehavior = {
  ...EShortTermDebtBehavior,
  ...EPayableBehavior,
  ...ELongTermLoanBehavior,
  Default: 'default',
} as const;

export type ULiabilityAccountBehavior =
  (typeof ELiabilityAccountBehavior)[keyof typeof ELiabilityAccountBehavior];

export interface ILiabilityLedgerAccount extends ILedgerAccount {
  code: TLiabilityLedgerCode;
  type: typeof ELedgerType.Liability;
  subType: ULiabilitySubType;
  behavior: ULiabilityAccountBehavior;
}

/**
 * =============== Suspense Accounts =================
 * code: 299xxx
 * @see {@link ../__docs__/02-liability-accounts.md#suspense-accounts} for documentation
 */
export interface ILiabilitySuspenseAccount extends ISuspenseLedgerAccount {
  code: TLiabilitySuspenseLedgerCode;
  type: typeof ELedgerType.Liability;
  subType: TSuspenseSubType;
  behavior: typeof ELiabilityAccountBehavior.Default;
}

/**
 * =============== Short Term Debts ===============
 * code: 200xxx
 * @see {@link ../__docs__/02-liability-accounts.md#short-term-debts} for documentation
 */

export interface IShortTermDebtAccount extends ILiabilityLedgerAccount {
  code: TShortTermDebtLedgerCode;
  subType: typeof ELiabilitySubType.ShortTermDebt;
  behavior: UShortTermDebtBehavior;
  contraAccountRule: typeof EContraAccountRule.ContraPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctPermitted;
}

export interface ICreditCardAccountMeta {
  cardIssuer: string;
  lastFourDigits: string;
  lastReconciliationDate: Date | null;
}

export interface ICreditCardAccount extends IShortTermDebtAccount {
  controlAccountId: TEntityId;
  behavior: typeof EShortTermDebtBehavior.CreditCard;
  meta: ICreditCardAccountMeta;
}

export interface IOverdraftAccountMeta {
  linkedBankAccountId: TEntityId;
}

export interface IOverdraftAccount extends IShortTermDebtAccount {
  behavior: typeof EShortTermDebtBehavior.Overdraft;
  meta: IOverdraftAccountMeta;
}

export interface IShortTermLoanAccountMeta {
  lenderName: string;
  maturityDate: Date | null;
}

export interface IShortTermLoanAccount extends IShortTermDebtAccount {
  behavior: typeof EShortTermDebtBehavior.ShortTermLoan;
  meta: IShortTermLoanAccountMeta;
}

/**
 * =============== Payables ===============
 * code: 201xxx
 * @see {@link ../__docs__/02-liability-accounts.md#payables} for documentation
 */
export interface IPayableAccount extends ILiabilityLedgerAccount {
  code: TPayablesLedgerCode;
  subType: typeof ELiabilitySubType.Payable;
  behavior: UPayableBehavior | typeof ELiabilityAccountBehavior.Default;
  contraAccountRule:
    | typeof EContraAccountRule.ContraPermitted
    | typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule:
    | typeof EAdjunctAccountRule.AdjunctPermitted
    | typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

import { UTaxType } from './tax.types';

export interface IStatutoryPayableAccountMeta {
  taxAuthority: string;
  taxType: UTaxType;
}

export interface IStatutoryPayableAccount extends IPayableAccount {
  controlAccountId: TEntityId;
  behavior: typeof EPayableBehavior.TaxPayable;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
  meta: IStatutoryPayableAccountMeta;
}

export interface ITradePayableAccountMeta {
  vendorId: TEntityId;
  invoiceId: TEntityId;
}

export interface ITradePayableAccount extends IPayableAccount {
  controlAccountId: TEntityId;
  behavior: typeof EPayableBehavior.TradePayable;
  meta: ITradePayableAccountMeta;
}

/**
 * =============== Accrued Expenses ===============
 * code: 202xxx
 */
export interface IAccruedExpenseAccount extends ILiabilityLedgerAccount {
  code: TAccruedExpenseLedgerCode;
  subType: typeof ELiabilitySubType.AccruedExpense;
  behavior: typeof ELiabilityAccountBehavior.Default;
  contraAccountRule: typeof EContraAccountRule.ContraPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctPermitted;
}

/**
 * =============== Deferred Revenues ===============
 * code: 203xxx
 */
export interface IDeferredRevenueAccount extends ILiabilityLedgerAccount {
  code: TDeferredRevenueLedgerCode;
  subType: typeof ELiabilitySubType.DeferredRevenue;
  behavior: typeof ELiabilityAccountBehavior.Default;
  contraAccountRule: typeof EContraAccountRule.ContraPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctPermitted;
}

/**
 * =============== Long Term Loans ===============
 * code: 204xxx
 * @see {@link ../__docs__/02-liability-accounts.md#long-term-loans} for documentation
 */
export interface ILongTermLoanAccount extends ILiabilityLedgerAccount {
  code: TLongTermLoanLedgerCode;
  subType: typeof ELiabilitySubType.LongTermLoan;
  behavior: ULongTermLoanBehavior;
  contraAccountRule: typeof EContraAccountRule.ContraPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctPermitted;
}

export interface IMortgageAccountMeta {
  lenderName: string;
  propertyAddress: string;
  maturityDate: Date | null;
}

export interface IMortgageAccount extends ILongTermLoanAccount {
  behavior: typeof ELongTermLoanBehavior.Mortgage;
  meta: IMortgageAccountMeta;
}

export interface IOtherLongTermLoanAccountMeta {
  lenderName: string;
  maturityDate: Date | null;
}

export interface IOtherLongTermLoanAccount extends ILongTermLoanAccount {
  behavior: typeof ELongTermLoanBehavior.OtherLongTermLoan;
  meta: IOtherLongTermLoanAccountMeta;
}

/**
 * =============== Lease Liabilities ===============
 * code: 205xxx
 */
export interface ILeaseLiabilityAccount extends ILiabilityLedgerAccount {
  code: TLeaseLiabilityLedgerCode;
  subType: typeof ELiabilitySubType.LeaseLiability;
  behavior: typeof ELiabilityAccountBehavior.Default;
  contraAccountRule: typeof EContraAccountRule.ContraPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctPermitted;
}

/**
 * =============== Provisions ===============
 * code: 206xxx
 */
export interface IProvisionAccount extends ILiabilityLedgerAccount {
  code: TProvisionLedgerCode;
  subType: typeof ELiabilitySubType.Provision;
  behavior: typeof ELiabilityAccountBehavior.Default;
  contraAccountRule: typeof EContraAccountRule.ContraPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctPermitted;
}
