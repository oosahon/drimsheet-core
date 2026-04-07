import { ICurrency } from '../../domain/currency/types/currency.types';

export interface IMoney {
  amount: bigint;
  currency: ICurrency;
}
