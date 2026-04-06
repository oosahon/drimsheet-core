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
import { ICurrency } from '../../../domain/currency/types/currency.types';

export const NAIRA: ICurrency = {
  name: 'Naira',
  symbol: '₦',
  code: 'NGN',
  minorUnit: 2n,
};

export const USD: ICurrency = {
  name: 'United States Dollar',
  symbol: '$',
  code: 'USD',
  minorUnit: 2n,
};

export const EUR: ICurrency = {
  name: 'Euro',
  symbol: '€',
  code: 'EUR',
  minorUnit: 2n,
};

export const GBP: ICurrency = {
  name: 'British Pound',
  symbol: '£',
  code: 'GBP',
  minorUnit: 2n,
};

export const CAD: ICurrency = {
  name: 'Canadian Dollar',
  symbol: '$',
  code: 'CAD',
  minorUnit: 2n,
};

export const YEN: ICurrency = {
  name: 'Yen',
  symbol: '¥',
  code: 'JPY',
  minorUnit: 0n,
};

export const YUAN: ICurrency = {
  name: 'Yuan',
  symbol: '¥',
  code: 'CNY',
  minorUnit: 2n,
};

const DIRHAM: ICurrency = {
  name: 'Dirham',
  symbol: 'د.إ',
  code: 'AED',
  minorUnit: 2n,
};

export const SYSTEM_CURRENCIES: readonly ICurrency[] = [
  NAIRA,
  USD,
  EUR,
  GBP,
  CAD,
  YEN,
  YUAN,
  DIRHAM,
];
