import { TEntityId } from '../../../shared/types/uuid';
import { ICurrency } from '../../currency/types/currency.types';

export const EAccountingEntityType = {
  Individual: 'individual',
  SoleTrader: 'sole_trader',
  Company: 'company',
} as const;

export type UAccountingEntityType =
  (typeof EAccountingEntityType)[keyof typeof EAccountingEntityType];

/**
 * Represents the month and day on which an accounting entity's fiscal year ends.
 * Defaults to December 31 for individuals. Companies and sole traders
 * may configure any valid calendar date (e.g., March 31, June 30).
 */
export interface IFiscalYearStart {
  month: number;
  day: number;
}

export interface IAccountingEntity {
  id: TEntityId;
  name: string;
  operatingCountryCode: string;
  type: UAccountingEntityType;
  ownerId: TEntityId;
  functionalCurrency: ICurrency;
  reportingCurrency: ICurrency;
  fiscalYearStart: IFiscalYearStart;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
