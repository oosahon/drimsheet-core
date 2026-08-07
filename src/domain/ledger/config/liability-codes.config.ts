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

type TShortTermKeys = 'PREFIX' | 'HEADER';
const SHORT_TERM_DEBT: Record<TShortTermKeys, TShortTermDebtLedgerCode> = {
  PREFIX: '200',
  HEADER: '200000',
} as const;

type TPayablesKeys = 'PREFIX' | 'HEADER' | 'TRADE' | 'STATUTORY';
const PAYABLES: Record<TPayablesKeys, TPayablesLedgerCode> = {
  PREFIX: '201',
  HEADER: '201000',
  TRADE: '201001',
  STATUTORY: '201002',
} as const;

type TSuspenseKeys = 'PREFIX' | 'INITIAL';
const SUSPENSE_ACCOUNTS: Record<TSuspenseKeys, TLiabilitySuspenseLedgerCode> = {
  PREFIX: '299',
  INITIAL: '299000',
} as const;

export const LIABILITY_LEDGER_CODES = {
  SHORT_TERM_DEBT,

  PAYABLES,

  SUSPENSE_ACCOUNTS,
};
