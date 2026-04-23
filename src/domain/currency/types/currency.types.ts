export interface ICurrency {
  code: string;
  symbol: string;
  name: string;
  minorUnit: bigint;
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
