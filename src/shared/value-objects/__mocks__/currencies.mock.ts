import { ICurrency } from '../../../domain/currency/types/currency.types';

const Naira: ICurrency = {
  code: 'NGN',
  symbol: '₦',
  name: 'Naira',
  minorUnit: 2n,
};

const USDollar: ICurrency = {
  code: 'USD',
  symbol: '$',
  name: 'Dollar',
  minorUnit: 2n,
};

const CanadianDollar: ICurrency = {
  code: 'CAD',
  symbol: '$',
  name: 'Dollar',
  minorUnit: 2n,
};

const Euro: ICurrency = {
  code: 'EUR',
  symbol: '€',
  name: 'Euro',
  minorUnit: 2n,
};

const Pounds: ICurrency = {
  code: 'GBP',
  symbol: '£',
  name: 'Pounds',
  minorUnit: 2n,
};

const Yen: ICurrency = {
  code: 'JPY',
  symbol: '¥',
  name: 'Yen',
  minorUnit: 0n,
};

const mockCurrencies = Object.freeze({
  NGN: Naira,
  USD: USDollar,
  CAD: CanadianDollar,
  EUR: Euro,
  GBP: Pounds,
  JPY: Yen,
});

export default mockCurrencies;
