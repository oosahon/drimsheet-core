import {
  TAssetDisposalLossLedgerCode,
  TBankChargeLedgerCode,
  TDirectCostsLedgerCode,
  TFinanceCostLedgerCode,
  TIncomeTaxLedgerCode,
  TInterestLedgerCode,
  TRentUtilitiesLedgerCode,
  TUnrealizedLossLedgerCode,
} from '../../shared/types/ledger-code.types';

const DIRECT_COSTS: Record<string, TDirectCostsLedgerCode> = {
  HEADER: '500000',
} as const;

const RENT_AND_UTILITIES: Record<string, TRentUtilitiesLedgerCode> = {
  HEADER: '502000',
} as const;

const BANK_CHARGE: Record<string, TBankChargeLedgerCode> = {
  HEADER: '507000',
} as const;

const FINANCE_COST: Record<string, TFinanceCostLedgerCode> = {
  HEADER: '508000',
} as const;

const INTEREST: Record<string, TInterestLedgerCode> = {
  HEADER: '509000',
} as const;

const TAX_EXPENSE: Record<string, TIncomeTaxLedgerCode> = {
  HEADER: '510000',
} as const;

const UNREALIZED_LOSS: Record<string, TUnrealizedLossLedgerCode> = {
  HEADER: '511000',
} as const;

const ASSET_DISPOSAL_LOSS: Record<string, TAssetDisposalLossLedgerCode> = {
  HEADER: '512000',
} as const;

export const EXPENSE_LEDGER_CODES = {
  DIRECT_COSTS,
  RENT_AND_UTILITIES,
  BANK_CHARGE,
  FINANCE_COST,
  INTEREST,
  TAX_EXPENSE,
  UNREALIZED_LOSS,
  ASSET_DISPOSAL_LOSS,
};
