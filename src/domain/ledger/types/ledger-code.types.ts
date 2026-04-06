/**
 * ===================== ASSET LEDGER CODES =====================
 * @see {@link ../__docs__/asset-ledger.md} to understand the structure of asset ledger codes
 */
declare const AssetPrefix = '1';
export type TAssetLedgerCode = `${typeof AssetPrefix}${string}`;

declare const CashPrefix = '100';
export type TCashLedgerCode = `${typeof CashPrefix}${string}`;

declare const ShortTermInvestmentPrefix = '101';
export type TShortTermInvestmentLedgerCode =
  `${typeof ShortTermInvestmentPrefix}${string}`;

declare const ReceivablesPrefix = '102';
export type TReceivablesLedgerCode = `${typeof ReceivablesPrefix}${string}`;

declare const InventoryPrefix = '103';
export type TInventoryLedgerCode = `${typeof InventoryPrefix}${string}`;

declare const AccruedIncomePrefix = '104';
export type TAccruedIncomeLedgerCode = `${typeof AccruedIncomePrefix}${string}`;

declare const PrepaymentsPrefix = '105';
export type TPrepaymentsLedgerCode = `${typeof PrepaymentsPrefix}${string}`;

declare const LongTermInvestmentPrefix = '106';
export type TLongTermInvestmentLedgerCode =
  `${typeof LongTermInvestmentPrefix}${string}`;

declare const PPEPrefix = '107';
export type TPPELedgerCode = `${typeof PPEPrefix}${string}`;

declare const IntangibleAssetsPrefix = '108';
export type TIntangibleAssetsLedgerCode =
  `${typeof IntangibleAssetsPrefix}${string}`;

declare const ROUAssetsPrefix = '109';
export type TROUAssetsLedgerCode = `${typeof ROUAssetsPrefix}${string}`;

declare const GoodwillPrefix = '110';
export type TGoodwillLedgerCode = `${typeof GoodwillPrefix}${string}`;

declare const SuspensePrefix = '199';
export type TAssetSuspenseLedgerCode = `${typeof SuspensePrefix}${string}`;

/**
 * ===================== LIABILITY LEDGER CODES =====================
 * @see {@link ../__docs__/liability-ledger.md} to understand the structure of liability ledger codes
 */
declare const LiabilityPrefix = '2';
export type TLiabilityLedgerCode = `${typeof LiabilityPrefix}${string}`;

declare const ShortTermDebtPrefix = '200';
export type TShortTermDebtLedgerCode = `${typeof ShortTermDebtPrefix}${string}`;

declare const PayablesPrefix = '201';
export type TPayablesLedgerCode = `${typeof PayablesPrefix}${string}`;

declare const AccruedExpensePrefix = '202';
export type TAccruedExpenseLedgerCode =
  `${typeof AccruedExpensePrefix}${string}`;

declare const DeferredRevenuePrefix = '203';
export type TDeferredRevenueLedgerCode =
  `${typeof DeferredRevenuePrefix}${string}`;

declare const LongTermLoanPrefix = '204';
export type TLongTermLoanLedgerCode = `${typeof LongTermLoanPrefix}${string}`;

declare const LeaseLiabilityPrefix = '205';
export type TLeaseLiabilityLedgerCode =
  `${typeof LeaseLiabilityPrefix}${string}`;

declare const ProvisionPrefix = '206';
export type TProvisionLedgerCode = `${typeof ProvisionPrefix}${string}`;

declare const LiabilitySuspensePrefix = '299';
export type TLiabilitySuspenseLedgerCode =
  `${typeof LiabilitySuspensePrefix}${string}`;

/**
 * ===================== EQUITY LEDGER CODES =====================
 * @see {@link ../__docs__/03-equity-accounts.md} to understand the structure of equity ledger codes
 */
declare const EquityPrefix = '3';
export type TEquityLedgerCode = `${typeof EquityPrefix}${string}`;

declare const CapitalPrefix = '300';
export type TCapitalLedgerCode = `${typeof CapitalPrefix}${string}`;

declare const RetainedEarningsPrefix = '301';
export type TRetainedEarningsLedgerCode =
  `${typeof RetainedEarningsPrefix}${string}`;

declare const ReservesPrefix = '302';
export type TReservesLedgerCode = `${typeof ReservesPrefix}${string}`;

declare const OpeningBalanceEquityPrefix = '399';
export type TOpeningBalanceEquityLedgerCode =
  `${typeof OpeningBalanceEquityPrefix}${string}`;

/**
 * ===================== REVENUE LEDGER CODES =====================
 * @see {@link ../__docs__/04-revenue-accounts.md} to understand the structure of revenue ledger codes
 */
declare const RevenuePrefix = '4';
export type TRevenueLedgerCode = `${typeof RevenuePrefix}${string}`;

declare const SalesPrefix = '400';
export type TSalesLedgerCode = `${typeof SalesPrefix}${string}`;

declare const ServicesPrefix = '401';
export type TServicesLedgerCode = `${typeof ServicesPrefix}${string}`;

declare const SubscriptionsPrefix = '402';
export type TSubscriptionsLedgerCode = `${typeof SubscriptionsPrefix}${string}`;

declare const EmploymentIncomePrefix = '403';
export type TEmploymentIncomeLedgerCode =
  `${typeof EmploymentIncomePrefix}${string}`;

declare const InterestIncomePrefix = '404';
export type TInterestIncomeLedgerCode =
  `${typeof InterestIncomePrefix}${string}`;

declare const GainOnSalePrefix = '405';
export type TGainOnSaleLedgerCode = `${typeof GainOnSalePrefix}${string}`;

declare const UnrealizedGainPrefix = '406';
export type TUnrealizedGainLedgerCode =
  `${typeof UnrealizedGainPrefix}${string}`;

/**
 * ===================== EXPENSE LEDGER CODES =====================
 * @see {@link ../__docs__/05-expense-accounts.md} to understand the structure of expense ledger codes
 */
declare const ExpensePrefix = '5';
export type TExpenseLedgerCode = `${typeof ExpensePrefix}${string}`;

declare const DirectCostsPrefix = '500';
export type TDirectCostsLedgerCode = `${typeof DirectCostsPrefix}${string}`;

declare const PayrollPrefix = '501';
export type TPayrollLedgerCode = `${typeof PayrollPrefix}${string}`;

declare const RentUtilitiesPrefix = '502';
export type TRentUtilitiesLedgerCode = `${typeof RentUtilitiesPrefix}${string}`;

declare const AdminGeneralPrefix = '503';
export type TAdminGeneralLedgerCode = `${typeof AdminGeneralPrefix}${string}`;

declare const MarketingSellingPrefix = '504';
export type TMarketingSellingLedgerCode =
  `${typeof MarketingSellingPrefix}${string}`;

declare const ResearchDevPrefix = '505';
export type TResearchDevLedgerCode = `${typeof ResearchDevPrefix}${string}`;

declare const DepreciationAmortizationPrefix = '506';
export type TDepreciationAmortizationLedgerCode =
  `${typeof DepreciationAmortizationPrefix}${string}`;

declare const InterestFinancePrefix = '507';
export type TInterestFinanceLedgerCode =
  `${typeof InterestFinancePrefix}${string}`;

declare const IncomeTaxPrefix = '508';
export type TIncomeTaxLedgerCode = `${typeof IncomeTaxPrefix}${string}`;

declare const UnrealizedLossPrefix = '509';
export type TUnrealizedLossLedgerCode =
  `${typeof UnrealizedLossPrefix}${string}`;

declare const AssetDisposalLossPrefix = '510';
export type TAssetDisposalLossLedgerCode =
  `${typeof AssetDisposalLossPrefix}${string}`;

declare const ImpairmentLossPrefix = '511';
export type TImpairmentLossLedgerCode =
  `${typeof ImpairmentLossPrefix}${string}`;

declare const OtherLossesPrefix = '512';
export type TOtherLossesLedgerCode = `${typeof OtherLossesPrefix}${string}`;
