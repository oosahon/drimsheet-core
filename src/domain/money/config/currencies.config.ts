/**
 * ⚠️ WARNING: SYSTEM CRITICAL DATA ⚠️
 *
 * DO NOT MODIFY, DELETE, OR REORDER items in this file without
 * explicit architectural approval.
 *
 * These records are bootstrapped into the production database.
 * Changing existing keys, IDs, or values here will cause database
 * sync issues, broken relationships, or application startup failures.
 *
 * If you need to add a new category or currency, carefully review
 * the migration guidelines first.
 */
import { ICurrency } from '../types/currency.types';

const AED: ICurrency = {
  name: 'United Arab Emirates Dirham',
  symbol: 'د.إ.',
  code: 'AED',
  minorUnit: 2,
};

const ARS: ICurrency = {
  name: 'Argentine Peso',
  symbol: '$',
  code: 'ARS',
  minorUnit: 2,
};

const AUD: ICurrency = {
  name: 'Australian Dollar',
  symbol: '$',
  code: 'AUD',
  minorUnit: 2,
};

const BDT: ICurrency = {
  name: 'Bangladeshi Taka',
  symbol: '৳',
  code: 'BDT',
  minorUnit: 2,
};

const BRL: ICurrency = {
  name: 'Brazilian Real',
  symbol: 'R$',
  code: 'BRL',
  minorUnit: 2,
};

const CAD: ICurrency = {
  name: 'Canadian Dollar',
  symbol: '$',
  code: 'CAD',
  minorUnit: 2,
};

const CHF: ICurrency = {
  name: 'Swiss Franc',
  symbol: 'CHF',
  code: 'CHF',
  minorUnit: 2,
};

const CLP: ICurrency = {
  name: 'Chilean Peso',
  symbol: '$',
  code: 'CLP',
  minorUnit: 0,
};

const CNY: ICurrency = {
  name: 'Chinese Yuan',
  symbol: '¥',
  code: 'CNY',
  minorUnit: 2,
};

const COP: ICurrency = {
  name: 'Colombian Peso',
  symbol: '$',
  code: 'COP',
  minorUnit: 2,
};

const CZK: ICurrency = {
  name: 'Czech Koruna',
  symbol: 'Kč',
  code: 'CZK',
  minorUnit: 2,
};

const DKK: ICurrency = {
  name: 'Danish Krone',
  symbol: 'kr.',
  code: 'DKK',
  minorUnit: 2,
};

const DZD: ICurrency = {
  name: 'Algerian Dinar',
  symbol: 'د.ج.',
  code: 'DZD',
  minorUnit: 2,
};

const EGP: ICurrency = {
  name: 'Egyptian Pound',
  symbol: 'ج.م.',
  code: 'EGP',
  minorUnit: 2,
};

const EUR: ICurrency = {
  name: 'Euro',
  symbol: '€',
  code: 'EUR',
  minorUnit: 2,
};

const GBP: ICurrency = {
  name: 'British Pound',
  symbol: '£',
  code: 'GBP',
  minorUnit: 2,
};

const GHS: ICurrency = {
  name: 'Ghanaian Cedi',
  symbol: 'GH₵',
  code: 'GHS',
  minorUnit: 2,
};

const HKD: ICurrency = {
  name: 'Hong Kong Dollar',
  symbol: 'HK$',
  code: 'HKD',
  minorUnit: 2,
};

const HUF: ICurrency = {
  name: 'Hungarian Forint',
  symbol: 'Ft',
  code: 'HUF',
  minorUnit: 2,
};

const IDR: ICurrency = {
  name: 'Indonesian Rupiah',
  symbol: 'Rp',
  code: 'IDR',
  minorUnit: 2,
};

const ILS: ICurrency = {
  name: 'Israeli New Shekel',
  symbol: '₪',
  code: 'ILS',
  minorUnit: 2,
};

const INR: ICurrency = {
  name: 'Indian Rupee',
  symbol: '₹',
  code: 'INR',
  minorUnit: 2,
};

const JPY: ICurrency = {
  name: 'Japanese Yen',
  symbol: '￥',
  code: 'JPY',
  minorUnit: 0,
};

const KES: ICurrency = {
  name: 'Kenyan Shilling',
  symbol: 'Ksh',
  code: 'KES',
  minorUnit: 2,
};

const KRW: ICurrency = {
  name: 'South Korean Won',
  symbol: '₩',
  code: 'KRW',
  minorUnit: 0,
};

const MAD: ICurrency = {
  name: 'Moroccan Dirham',
  symbol: 'د.م.',
  code: 'MAD',
  minorUnit: 2,
};

const MXN: ICurrency = {
  name: 'Mexican Peso',
  symbol: '$',
  code: 'MXN',
  minorUnit: 2,
};

const MYR: ICurrency = {
  name: 'Malaysian Ringgit',
  symbol: 'RM',
  code: 'MYR',
  minorUnit: 2,
};

const NGN: ICurrency = {
  name: 'Nigerian Naira',
  symbol: '₦',
  code: 'NGN',
  minorUnit: 2,
};

const NOK: ICurrency = {
  name: 'Norwegian Krone',
  symbol: 'kr',
  code: 'NOK',
  minorUnit: 2,
};

const NZD: ICurrency = {
  name: 'New Zealand Dollar',
  symbol: '$',
  code: 'NZD',
  minorUnit: 2,
};

const PEN: ICurrency = {
  name: 'Peruvian Sol',
  symbol: 'S/',
  code: 'PEN',
  minorUnit: 2,
};

const PHP: ICurrency = {
  name: 'Philippine Peso',
  symbol: '₱',
  code: 'PHP',
  minorUnit: 2,
};

const PKR: ICurrency = {
  name: 'Pakistani Rupee',
  symbol: 'Rs',
  code: 'PKR',
  minorUnit: 2,
};

const PLN: ICurrency = {
  name: 'Polish Zloty',
  symbol: 'zł',
  code: 'PLN',
  minorUnit: 2,
};

const RON: ICurrency = {
  name: 'Romanian Leu',
  symbol: 'RON',
  code: 'RON',
  minorUnit: 2,
};

const RUB: ICurrency = {
  name: 'Russian Ruble',
  symbol: '₽',
  code: 'RUB',
  minorUnit: 2,
};

const SAR: ICurrency = {
  name: 'Saudi Riyal',
  symbol: 'ر.س.',
  code: 'SAR',
  minorUnit: 2,
};

const SEK: ICurrency = {
  name: 'Swedish Krona',
  symbol: 'kr',
  code: 'SEK',
  minorUnit: 2,
};

const SGD: ICurrency = {
  name: 'Singapore Dollar',
  symbol: '$',
  code: 'SGD',
  minorUnit: 2,
};

const THB: ICurrency = {
  name: 'Thai Baht',
  symbol: '฿',
  code: 'THB',
  minorUnit: 2,
};

const TRY: ICurrency = {
  name: 'Turkish Lira',
  symbol: '₺',
  code: 'TRY',
  minorUnit: 2,
};

const TWD: ICurrency = {
  name: 'New Taiwan Dollar',
  symbol: '$',
  code: 'TWD',
  minorUnit: 2,
};

const TZS: ICurrency = {
  name: 'Tanzanian Shilling',
  symbol: 'TSh',
  code: 'TZS',
  minorUnit: 2,
};

const UAH: ICurrency = {
  name: 'Ukrainian Hryvnia',
  symbol: '₴',
  code: 'UAH',
  minorUnit: 2,
};

const UGX: ICurrency = {
  name: 'Ugandan Shilling',
  symbol: 'USh',
  code: 'UGX',
  minorUnit: 0,
};

const USD: ICurrency = {
  name: 'US Dollar',
  symbol: '$',
  code: 'USD',
  minorUnit: 2,
};

const VND: ICurrency = {
  name: 'Vietnamese Dong',
  symbol: '₫',
  code: 'VND',
  minorUnit: 0,
};

const XAF: ICurrency = {
  name: 'Central African CFA Franc',
  symbol: 'FCFA',
  code: 'XAF',
  minorUnit: 0,
};

const XOF: ICurrency = {
  name: 'West African CFA Franc',
  symbol: 'F CFA',
  code: 'XOF',
  minorUnit: 0,
};

const ZAR: ICurrency = {
  name: 'South African Rand',
  symbol: 'R',
  code: 'ZAR',
  minorUnit: 2,
};

export const SYSTEM_CURRENCIES = Object.freeze({
  AED,
  ARS,
  AUD,
  BDT,
  BRL,
  CAD,
  CHF,
  CLP,
  CNY,
  COP,
  CZK,
  DKK,
  DZD,
  EGP,
  EUR,
  GBP,
  GHS,
  HKD,
  HUF,
  IDR,
  ILS,
  INR,
  JPY,
  KES,
  KRW,
  MAD,
  MXN,
  MYR,
  NGN,
  NOK,
  NZD,
  PEN,
  PHP,
  PKR,
  PLN,
  RON,
  RUB,
  SAR,
  SEK,
  SGD,
  THB,
  TRY,
  TWD,
  TZS,
  UAH,
  UGX,
  USD,
  VND,
  XAF,
  XOF,
  ZAR,
});

export type UCurrencyCode = keyof typeof SYSTEM_CURRENCIES;
