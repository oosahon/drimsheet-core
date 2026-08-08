/**
 * NB: codes are defined on a need-to-have basis
 * To see the full list of codes...
 * @see {@link src/domain/accounting/__doc__/accounting.md}
 */

import {
  TAssetDisposalLossLedgerCode,
  TBankChargeLedgerCode,
  TDirectCostsLedgerCode,
  TFinanceCostLedgerCode,
  TIncomeTaxLedgerCode,
  TInterestLedgerCode,
  TRentUtilitiesLedgerCode,
  TUnrealizedLossLedgerCode,
} from '@domain/ledger/types/ledger-code.types';

type Keys = 'HEADER' | 'PREFIX';

const DIRECT_COSTS: Record<Keys, TDirectCostsLedgerCode> = {
  PREFIX: '500',
  HEADER: '500000',
} as const;

const RENT_AND_UTILITIES: Record<Keys, TRentUtilitiesLedgerCode> = {
  PREFIX: '502',
  HEADER: '502000',
} as const;

const BANK_CHARGE: Record<Keys, TBankChargeLedgerCode> = {
  PREFIX: '507',
  HEADER: '507000',
} as const;

const FINANCE_COST: Record<Keys, TFinanceCostLedgerCode> = {
  PREFIX: '508',
  HEADER: '508000',
} as const;

const INTEREST: Record<Keys, TInterestLedgerCode> = {
  PREFIX: '509',
  HEADER: '509000',
} as const;

const TAX_EXPENSE: Record<Keys, TIncomeTaxLedgerCode> = {
  PREFIX: '510',
  HEADER: '510000',
} as const;

const UNREALIZED_LOSS: Record<Keys, TUnrealizedLossLedgerCode> = {
  PREFIX: '511',
  HEADER: '511000',
} as const;

const ASSET_DISPOSAL_LOSS: Record<Keys, TAssetDisposalLossLedgerCode> = {
  PREFIX: '512',
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
