/**
 * NB: codes are defined on a need-to-have basis
 * To see the full list of codes...
 * @see {@link src/domain/accounting/__doc__/accounting.md}
 */

import {
  TCashLedgerCode,
  TReceivablesLedgerCode,
} from '../types/ledger-code.types';

type TCashKeys = 'PREFIX' | 'HEADER';

const CASH_AND_EQUIVALENTS: Record<TCashKeys, TCashLedgerCode> = {
  PREFIX: '100',
  HEADER: '100000',
} as const;

type TReceivablesKeys = 'PREFIX' | 'HEADER' | 'TRADE' | 'STATUTORY';
const RECEIVABLES: Record<TReceivablesKeys, TReceivablesLedgerCode> = {
  PREFIX: '102',
  HEADER: '102000',
  TRADE: '102001',
  STATUTORY: '102002',
} as const;

export const ASSET_LEDGER_CODES = {
  CASH_AND_EQUIVALENTS,

  RECEIVABLES,

  SUSPENSE_ACCOUNT: '199000',
};
