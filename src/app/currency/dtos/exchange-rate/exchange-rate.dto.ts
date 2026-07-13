import { UExchangeRateType } from '../../../../domain/currency/types/exchange-rate.types';

export interface IExchangeRateDto {
  baseCurrencyCode: string;
  targetCurrencyCode: string;
  rate: number;
  type: UExchangeRateType;
  asOf: Date;
  source: string;
}
