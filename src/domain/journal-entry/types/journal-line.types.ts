import { TEntityId } from '@shared/types/uuid';

import { ICurrency } from '@domain/money/types/currency.types';
import { IExchangeRate } from '@domain/money/types/exchange-rate.types';
import { IMoney } from '@domain/money/types/money.types';

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
  counterpartyId: TEntityId | null;
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
  | 'accountId'
  | 'sequenceOrder'
  | 'amount'
  | 'exchangeRate'
  | 'side'
  | 'description'
> {
  counterpartyId?: TEntityId | null;
  functionalCurrency: ICurrency;
}

export type IJournalLineInput = Omit<IJournalLineMakePayload, 'side'>;
