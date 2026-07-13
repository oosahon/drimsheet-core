import { UExchangeRateType } from '../../../../domain/money/types/exchange-rate.types';

export interface IExchangeRateDto {
  baseCurrencyCode: string;
  targetCurrencyCode: string;
  rate: number;
  type: UExchangeRateType;
  asOf: Date;
  source: string;
}
