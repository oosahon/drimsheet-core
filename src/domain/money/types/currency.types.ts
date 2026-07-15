import { UCurrencyCode } from '../config/currencies.config';

export interface ICurrency {
  code: UCurrencyCode;
  symbol: string;
  name: string;
  minorUnit: number;
}

export interface ICurrencyWithEntityDates extends ICurrency {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ICurrencyExchangeRate {
  baseCurrencyCodeCode: string;
  targetCurrencyCodeCode: string;
  rate: number;
}

export interface ICurrencyExchangeRateWithEntityDates extends ICurrencyExchangeRate {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
