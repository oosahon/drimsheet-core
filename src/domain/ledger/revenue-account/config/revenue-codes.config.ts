/**
 * NB: codes are defined on a need-to-have basis
 * To see the full list of codes...
 * @see {@link src/domain/accounting/__doc__/accounting.md}
 */

import {
  TEmploymentIncomeLedgerCode,
  TGainOnAssetSaleLedgerCode,
  TGiftsLedgerCode,
  TGrantsLedgerCode,
  TServicesLedgerCode,
  TUnrealizedGainLedgerCode,
} from '../../shared/types/ledger-code.types';

const SERVICES: Record<string, TServicesLedgerCode> = {
  HEADER: '401000',
} as const;

const EMPLOYMENT_INCOME: Record<string, TEmploymentIncomeLedgerCode> = {
  HEADER: '403000',
} as const;

const GAIN_ON_ASSET_SALE: Record<string, TGainOnAssetSaleLedgerCode> = {
  HEADER: '405000',
} as const;

const UNREALIZED_GAINS: Record<string, TUnrealizedGainLedgerCode> = {
  HEADER: '406000',
} as const;

const GRANTS: Record<string, TGrantsLedgerCode> = {
  HEADER: '407000',
} as const;

const GIFTS: Record<string, TGiftsLedgerCode> = {
  HEADER: '408000',
} as const;

export const REVENUE_LEDGER_CODES = {
  SERVICES,
  EMPLOYMENT_INCOME,
  GAIN_ON_ASSET_SALE,
  UNREALIZED_GAINS,
  GRANTS,
  GIFTS,
};
