/**
 * NB: codes are defined on a need-to-have basis
 * To see the full list of codes...
 * @see {@link src/domain/accounting/__doc__/accounting.md}
 */

import {
  TAssetDisposalLossLedgerCode,
  TDirectCostsLedgerCode,
  TIncomeTaxLedgerCode,
  TInterestFinanceLedgerCode,
  TRentUtilitiesLedgerCode,
  TUnrealizedLossLedgerCode,
} from '../types/ledger-code.types';

const DIRECT_COSTS: Record<string, TDirectCostsLedgerCode> = {
  HEADER: '500000',
} as const;

const RENT_AND_UTILITIES: Record<string, TRentUtilitiesLedgerCode> = {
  HEADER: '502000',
} as const;

const FINANCE_COSTS: Record<string, TInterestFinanceLedgerCode> = {
  HEADER: '507000',
} as const;

const TAX_EXPENSE: Record<string, TIncomeTaxLedgerCode> = {
  HEADER: '508000',
} as const;

const UNREALIZED_LOSS: Record<string, TUnrealizedLossLedgerCode> = {
  HEADER: '509000',
} as const;

const ASSET_DISPOSAL_LOSS: Record<string, TAssetDisposalLossLedgerCode> = {
  HEADER: '510000',
} as const;

export const EXPENSE_LEDGER_CODES = {
  DIRECT_COSTS,
  RENT_AND_UTILITIES,
  FINANCE_COSTS,
  TAX_EXPENSE,
  UNREALIZED_LOSS,
  ASSET_DISPOSAL_LOSS,
};
