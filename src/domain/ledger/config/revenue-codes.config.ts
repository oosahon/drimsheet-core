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
} from '@domain/ledger/types/ledger-code.types';

type Keys = 'HEADER' | 'PREFIX';

const SERVICES: Record<Keys, TServicesLedgerCode> = {
  HEADER: '401000',
  PREFIX: '401',
} as const;

const EMPLOYMENT_INCOME: Record<Keys, TEmploymentIncomeLedgerCode> = {
  HEADER: '403000',
  PREFIX: '403',
} as const;

const GAIN_ON_ASSET_SALE: Record<Keys, TGainOnAssetSaleLedgerCode> = {
  HEADER: '405000',
  PREFIX: '405',
} as const;

const UNREALIZED_GAINS: Record<Keys, TUnrealizedGainLedgerCode> = {
  HEADER: '406000',
  PREFIX: '406',
} as const;

const GRANTS: Record<Keys, TGrantsLedgerCode> = {
  HEADER: '407000',
  PREFIX: '407',
} as const;

const GIFTS: Record<Keys, TGiftsLedgerCode> = {
  HEADER: '408000',
  PREFIX: '408',
} as const;

export const REVENUE_LEDGER_CODES = {
  SERVICES,
  EMPLOYMENT_INCOME,
  GAIN_ON_ASSET_SALE,
  UNREALIZED_GAINS,
  GRANTS,
  GIFTS,
};
