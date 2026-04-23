import { IMoney } from '../../../shared/types/money.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IExchangeRate } from '../../currency/types/exchange-rate.types';

export const EJournalSide = {
  Debit: 'debit',
  Credit: 'credit',
} as const;

export type UJournalSide = (typeof EJournalSide)[keyof typeof EJournalSide];

interface IJournalLineItemMeta extends Record<
  string,
  string | object | boolean | null
> {}

export interface IJournalLineItem {
  id: TEntityId;
  entryId: TEntityId;
  accountId: TEntityId;
  sequenceOrder: number;
  amount: IMoney;
  exchangeRate: IExchangeRate | null; // if null, functionalAmount === amount
  functionalAmount: IMoney; // derived from amount and exchangeRate
  side: UJournalSide;
  description?: string;
  meta?: IJournalLineItemMeta;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
