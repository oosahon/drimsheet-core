export const EExchangeRateType = {
  Official: 'official',
  Negotiated: 'negotiated',
} as const;

export type UExchangeRateType =
  (typeof EExchangeRateType)[keyof typeof EExchangeRateType];

export interface IExchangeRate {
  currencyPair: string;
  baseCurrencyCode: string;
  targetCurrencyCode: string;
  rate: number;
  type: UExchangeRateType;
  asOf: Date;
  source: string;
  createdAt: Date;
}
