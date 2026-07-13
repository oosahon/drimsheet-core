import { IMoney } from '../../../domain/money/types/money.types';
import { TEntityId } from '../../../shared/types/uuid';
import { ICurrency } from '../../money/types/currency.types';
import { IExchangeRate } from '../../money/types/exchange-rate.types';

export const EJournalSide = {
  Debit: 'debit',
  Credit: 'credit',
} as const;

export type UJournalSide = (typeof EJournalSide)[keyof typeof EJournalSide];

export interface IJournalLineMeta extends Record<
  string,
  string | object | boolean | null
> {}

export interface IJournalLine {
  id: TEntityId;
  entryId: TEntityId;
  accountId: TEntityId;
  sequenceOrder: number;
  amount: IMoney;
  exchangeRate: IExchangeRate | null; // if null, functionalAmount === amount
  functionalAmount: IMoney; // derived from amount and exchangeRate
  side: UJournalSide;
  description: string | null;
  meta: IJournalLineMeta | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJournalLineMakePayload extends Pick<
  IJournalLine,
  'accountId' | 'sequenceOrder' | 'amount' | 'exchangeRate' | 'side'
> {
  functionalCurrency: ICurrency;
  // TODO: use `null` instead of undefined
  description: string | null;
}

export type IJournalLineInput = Omit<IJournalLineMakePayload, 'side'>;
