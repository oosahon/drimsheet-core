/**
 * NB: codes are defined on a need-to-have basis
 * To see the full list of codes...
 * @see {@link src/domain/accounting/__doc__/accounting.md}
 */

import {
  TAssetSuspenseLedgerCode,
  TCashLedgerCode,
  TLiabilitySuspenseLedgerCode,
  TReceivablesLedgerCode,
} from '../types/ledger-code.types';

const CASH_AND_EQUIVALENTS: Record<string, TCashLedgerCode> = {
  HEADER: '100000',
} as const;

const RECEIVABLES: Record<string, TReceivablesLedgerCode> = {
  HEADER: '102000',
  TRADE: '102001',
  STATUTORY: '102002',
} as const;

const SUSPENSE_ACCOUNTS = {
  ASSET: '199001' as TAssetSuspenseLedgerCode,
  LIABILITY: '299001' as TLiabilitySuspenseLedgerCode,
} as const;

export const ASSET_LEDGER_CODES = {
  CASH_AND_EQUIVALENTS,

  RECEIVABLES,

  SUSPENSE_ACCOUNTS,
};
