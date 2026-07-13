import {
  EAccountingEntityType,
  UAccountingEntityType,
} from '../../../../domain/accounting/types/accounting-entity.types';
import { UPeriodUnit } from '../../../../domain/accounting/types/period.types';
import { UAppUsageModePreference } from '../../../../domain/user/types/user-preferences.types';

/**
 * Fiscal year creation DTO
 */
export interface IFiscalYearCreationDto {
  startDate: Date;
  endDate: Date;
}

export interface IPeriodCreationDto {
  unit: UPeriodUnit;
  count: number;
}

/**
 * Accounting entity onboarding DTO
 */
export interface IAccountingEntityCreationDto {
  name: string;
  entityType: UAccountingEntityType;
  jurisdictionCode: string;
  accountingStandardCode: string;
  functionalCurrencyCode: string;
  reportingCurrencyCode: string;
  fiscalYear: IFiscalYearCreationDto;
  accountingPeriod: IPeriodCreationDto;
  reportingPeriod: IPeriodCreationDto;
  appUsageMode: UAppUsageModePreference;
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
  accountingStandards: IAccountingStandardDto;
}
