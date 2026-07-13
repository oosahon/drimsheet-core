import { ICurrency } from './currency.types';

export interface IMoney {
  amount: bigint;
  currency: ICurrency;
}
