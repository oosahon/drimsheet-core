import { UAccountingStandardCode } from '@domain/accounting/config/accounting-standards.config';
import { UJurisdictionCode } from '@domain/accounting/config/jurisdictions.config';
import {
  EAccountingEntityType,
  UAccountingEntityType,
} from '@domain/accounting/types/accounting-entity.types';
import { UPeriodUnit } from '@domain/accounting/types/period.types';
import { UCurrencyCode } from '@domain/money/config/currencies.config';
import { UAppUsageModePreference } from '@domain/user/types/user-preferences.types';

/**
 * Fiscal year creation DTO
 */
export interface IFiscalYearCreationDto {
  startDate: Date;
  endDate: Date;
}

export interface IPeriodCreationDto {
  unit: UPeriodUnit;
  /**
   * @isInt
   * @minimum 1
   * @maximum 550
   */
  count: number;
}

/**
 * Accounting entity onboarding DTO
 */
export interface IAccountingEntityCreationDto {
  name: string;
  entityType: UAccountingEntityType;
  jurisdictionCode: UJurisdictionCode;
  accountingStandardCode: UAccountingStandardCode;
  functionalCurrencyCode: UCurrencyCode;
  reportingCurrencyCode: UCurrencyCode;
  fiscalYear: IFiscalYearCreationDto;
  accountingPeriod: IPeriodCreationDto;
  reportingPeriod: IPeriodCreationDto;
  appUsageMode: UAppUsageModePreference;
}

export interface IAccountingEntitySwitchReq {
  accountingEntityId: string;
}

export interface IAccountingStandardDto {
  [EAccountingEntityType.Individual]: string[];
  [EAccountingEntityType.SoleTrader]: string[];
  [EAccountingEntityType.PrivateCompany]: string[];
}

export interface IJurisdictionDto {
  code: string;
  name: string;
  currencyCode: string;
  maxFiscalMonths: number;
  accountingStandards: IAccountingStandardDto;
}
