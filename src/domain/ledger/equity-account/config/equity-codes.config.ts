/**
 * NB: codes are defined on a need-to-have basis
 * To see the full list of codes...
 * @see {@link src/domain/accounting/__doc__/accounting.md}
 */

import {
  TOpeningBalanceEquityLedgerCode,
  TRetainedEarningsLedgerCode,
} from '../../types/ledger-code.types';

const RETAINED_EARNINGS: Record<string, TRetainedEarningsLedgerCode> = {
  HEADER: '301000',
} as const;

const OPENING_BALANCE_EQUITY: Record<string, TOpeningBalanceEquityLedgerCode> =
  {
    HEADER: '399000',
  } as const;

export const EQUITY_LEDGER_CODES = {
  RETAINED_EARNINGS,
  OPENING_BALANCE_EQUITY,
};
