import { ELedgerType, ILedgerAccount } from './ledger.types';
import {
  TAssetLedgerCode,
  TAssetSuspenseLedgerCode,
  TCashLedgerCode,
  TShortTermInvestmentLedgerCode,
  TReceivablesLedgerCode,
  TInventoryLedgerCode,
  TAccruedIncomeLedgerCode,
  TPrepaymentsLedgerCode,
  TLongTermInvestmentLedgerCode,
  TPPELedgerCode,
  TIntangibleAssetsLedgerCode,
  TROUAssetsLedgerCode,
  TGoodwillLedgerCode,
} from './ledger-code.types';
import { EAdjunctAccountRule, EContraAccountRule } from './ledger.types';
import {
  ESuspenseSubType,
  ISuspenseLedgerAccount,
  TSuspenseSubType,
} from './suspense-account.types';
import { TEntityId } from '../../../shared/types/uuid';
import { UTaxType } from './tax.types';

export const EAssetSubType = {
  CashAndCashEquivalent: 'cash_and_cash_equivalent',
  ShortTermInvestment: 'short_term_investment',
  Receivables: 'receivables',
  Inventory: 'inventory',
  AccruedIncome: 'accrued_income',
  Prepayments: 'prepayments',
  LongTermInvestment: 'long_term_investment',
  PPE: 'property_plant_and_equipment',
  IntangibleAssets: 'intangible_assets',
  ROUAssets: 'right_of_use_assets',
  Goodwill: 'goodwill',
  Suspense: ESuspenseSubType.Suspense,
} as const;

export type UAssetSubType = (typeof EAssetSubType)[keyof typeof EAssetSubType];

/**
 ================== Behaviors ==================
 */
const ECashBehavior = {
  Bank: 'bank',
  PettyCash: 'petty_cash',
  DefaultCash: 'default_cash',
} as const;

type UCashBehavior = (typeof ECashBehavior)[keyof typeof ECashBehavior];

const EReceivableBehavior = {
  TaxReceivable: 'tax_receivable',
  TradeReceivable: 'trade_receivable',
  DefaultReceivables: 'default_receivables',
} as const;

type UReceivableBehavior =
  (typeof EReceivableBehavior)[keyof typeof EReceivableBehavior];

const EShortTermInvestmentBehavior = {
  StockAndETFs: 'stock_and_etfs',
  Bonds: 'bonds',
} as const;

type UShortTermInvestmentBehavior =
  (typeof EShortTermInvestmentBehavior)[keyof typeof EShortTermInvestmentBehavior];

export const EAssetAccountBehavior = {
  ...ECashBehavior,
  ...EShortTermInvestmentBehavior,
  ...EReceivableBehavior,
  Default: 'default',
} as const;

export type UAssetAccountBehavior =
  (typeof EAssetAccountBehavior)[keyof typeof EAssetAccountBehavior];

/**
 * =============== Base Asset Ledger Account ===============
 */

export interface IAssetLedgerAccount extends ILedgerAccount {
  code: TAssetLedgerCode;
  type: typeof ELedgerType.Asset;
  subType: UAssetSubType;
  behavior: UAssetAccountBehavior;
}

/**
 * =============== Suspense Accounts =================
 * code: 199xxx
 * @see {@link ../__docs__/asset-ledger.md#suspense-accounts} for documentation
 */
export interface IAssetSuspenseAccount extends ISuspenseLedgerAccount {
  code: TAssetSuspenseLedgerCode;
  type: typeof ELedgerType.Asset;
  subType: TSuspenseSubType;
  behavior: typeof EAssetAccountBehavior.Default;
}

/**
 * =============== Cash and Cash Equivalents ===============
 * code: 100xxx
 * @see {@link ../__docs__/asset-ledger.md#cash-and-cash-equivalents} for documentation
 */

export interface ICashAndCashEquivalentAccount extends IAssetLedgerAccount {
  code: TCashLedgerCode;
  subType: typeof EAssetSubType.CashAndCashEquivalent;
  behavior: UCashBehavior;
  contraAccountRule: typeof EContraAccountRule.ContraPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctPermitted;
}

export interface IBankAccountMeta {
  bankName: string;
  accountNumber: string;
  accountName: string;
  sortCode: string | null;
  swiftCode: string | null;
  iban: string | null;
  routingNumber: string | null;
  branchCode: string | null;
  lastReconciliationDate: Date | null;
}

export interface IBankAccount extends ICashAndCashEquivalentAccount {
  controlAccountId: TEntityId;
  behavior: typeof ECashBehavior.Bank;
  meta: IBankAccountMeta;
}

export interface IPettyCashAccountMeta {
  lastReconciliationDate: Date | null;
}
export interface IPettyCashAccount extends ICashAndCashEquivalentAccount {
  controlAccountId: TEntityId;
  behavior: typeof ECashBehavior.PettyCash;
  meta: IPettyCashAccountMeta;
}

/**
 * =============== Short Term Investments ===============
 * code: 101xxx
 * @see {@link ../__docs__/asset-ledger.md#short-term-investments} for documentation
 */

export interface IShortTermInvestmentAccount extends IAssetLedgerAccount {
  code: TShortTermInvestmentLedgerCode;
  subType: typeof EAssetSubType.ShortTermInvestment;
  behavior: UShortTermInvestmentBehavior;
  contraAccountRule: typeof EContraAccountRule.ContraPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctPermitted;
}

interface IStockAndETFsMeta {
  symbol: string;
  market: string;
  lastValuationDate: Date | null;
}
export interface IStockAndETFsAccount extends IShortTermInvestmentAccount {
  behavior: typeof EShortTermInvestmentBehavior.StockAndETFs;
  meta: IStockAndETFsMeta;
}

interface IBondsMeta {}
export interface IBonds extends IShortTermInvestmentAccount {
  behavior: typeof EShortTermInvestmentBehavior.Bonds;
  meta: IBondsMeta;
}

/**
 * =============== Receivables ===============
 * code: 102xxx
 * @see {@link ../__docs__/asset-ledger.md#receivables} for documentation
 */

export interface IReceivablesAccount extends IAssetLedgerAccount {
  code: TReceivablesLedgerCode;
  subType: typeof EAssetSubType.Receivables;
  behavior: UReceivableBehavior;
  contraAccountRule:
    | typeof EContraAccountRule.ContraPermitted
    | typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule:
    | typeof EAdjunctAccountRule.AdjunctPermitted
    | typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

export interface IStatutoryReceivableAccountMeta {
  taxAuthority: string;
  taxType: UTaxType;
}

export interface IStatutoryReceivableAccount extends IReceivablesAccount {
  controlAccountId: TEntityId;
  behavior: typeof EReceivableBehavior.TaxReceivable;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
  meta: IStatutoryReceivableAccountMeta;
}

export interface ITradeReceivableAccountMeta {
  customerId: TEntityId;
  invoiceId: TEntityId;
}

export interface ITradeReceivableAccount extends IReceivablesAccount {
  controlAccountId: TEntityId;
  behavior: typeof EReceivableBehavior.TradeReceivable;
  contraAccountRule: typeof EContraAccountRule.ContraPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctPermitted;
  meta: ITradeReceivableAccountMeta;
}

/**
 * =============== Inventory  ===============
 * code: 103xxx
 * @see {@link ../__docs__/asset-ledger.md#inventory} for documentation
 */
export interface IInventoryAccount extends IAssetLedgerAccount {
  code: TInventoryLedgerCode;
  subType: typeof EAssetSubType.Inventory;
  behavior: typeof EAssetAccountBehavior.Default;
  contraAccountRule: typeof EContraAccountRule.ContraPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctPermitted;
}

/**
 * =============== Accrued Income ===============
 * code: 104xxx
 * @see {@link ../__docs__/asset-ledger.md#accrued-income} for documentation
 */
export interface IAccruedIncomeAccount extends IAssetLedgerAccount {
  code: TAccruedIncomeLedgerCode;
  subType: typeof EAssetSubType.AccruedIncome;
  behavior: typeof EAssetAccountBehavior.Default;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Prepayments ===============
 * code: 105xxx
 * @see {@link ../__docs__/asset-ledger.md#prepayments} for documentation
 */
export interface IPrepaymentsAccount extends IAssetLedgerAccount {
  code: TPrepaymentsLedgerCode;
  subType: typeof EAssetSubType.Prepayments;
  behavior: typeof EAssetAccountBehavior.Default;
  contraAccountRule: typeof EContraAccountRule.ContraNotPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctNotPermitted;
}

/**
 * =============== Long Term Investments ===============
 * code: 106xxx
 * @see {@link ../__docs__/asset-ledger.md#long-term-investments} for documentation
 */
export interface ILongTermInvestmentAccount extends IAssetLedgerAccount {
  code: TLongTermInvestmentLedgerCode;
  subType: typeof EAssetSubType.LongTermInvestment;
  behavior: typeof EAssetAccountBehavior.Default;
  contraAccountRule: typeof EContraAccountRule.ContraPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctPermitted;
}

/**
 * =============== Property, Plant, and Equipment (PPE) ===============
 * code: 107xxx
 * @see {@link ../__docs__/asset-ledger.md#property-plant-and-equipment} for documentation
 */
export interface IPPEAccount extends IAssetLedgerAccount {
  code: TPPELedgerCode;
  subType: typeof EAssetSubType.PPE;
  behavior: typeof EAssetAccountBehavior.Default;
  contraAccountRule: typeof EContraAccountRule.ContraPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctPermitted;
}

/**
 * =============== Intangible Assets ===============
 * code: 108xxx
 * @see {@link ../__docs__/asset-ledger.md#intangible-assets} for documentation
 */
export interface IIntangibleAssetAccount extends IAssetLedgerAccount {
  code: TIntangibleAssetsLedgerCode;
  subType: typeof EAssetSubType.IntangibleAssets;
  behavior: typeof EAssetAccountBehavior.Default;
  contraAccountRule: typeof EContraAccountRule.ContraPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctPermitted;
}

/**
 * =============== Right of Use (ROU) Assets ===============
 * code: 109xxx
 * @see {@link ../__docs__/asset-ledger.md#right-of-use-assets} for documentation
 */
export interface IROUAssetAccount extends IAssetLedgerAccount {
  code: TROUAssetsLedgerCode;
  subType: typeof EAssetSubType.ROUAssets;
  behavior: typeof EAssetAccountBehavior.Default;
  contraAccountRule: typeof EContraAccountRule.ContraPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctPermitted;
}

/**
 * =============== Goodwill ===============
 * code: 110xxx
 * @see {@link ../__docs__/asset-ledger.md#goodwill} for documentation
 */
export interface IGoodwillAccount extends IAssetLedgerAccount {
  code: TGoodwillLedgerCode;
  subType: typeof EAssetSubType.Goodwill;
  behavior: typeof EAssetAccountBehavior.Default;
  contraAccountRule: typeof EContraAccountRule.ContraPermitted;
  adjunctAccountRule: typeof EAdjunctAccountRule.AdjunctPermitted;
}
