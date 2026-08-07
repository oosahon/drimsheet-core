/**
 * NB: codes are defined on a need-to-have basis
 * To see the full list of codes...
 * @see {@link src/domain/accounting/__doc__/accounting.md}
 */

import {
  TLiabilitySuspenseLedgerCode,
  TPayablesLedgerCode,
  TShortTermDebtLedgerCode,
} from '../types/ledger-code.types';

const SHORT_TERM_DEBT: Record<string, TShortTermDebtLedgerCode> = {
  HEADER: '200000',
} as const;

const PAYABLES: Record<string, TPayablesLedgerCode> = {
  HEADER: '201000',
  TRADE: '201001',
  STATUTORY: '201002',
} as const;

const SUSPENSE_ACCOUNTS = {
  HEADER: '299000' as TLiabilitySuspenseLedgerCode,
} as const;

export const LIABILITY_LEDGER_CODES = {
  SHORT_TERM_DEBT,

  PAYABLES,

  SUSPENSE_ACCOUNTS,
};
