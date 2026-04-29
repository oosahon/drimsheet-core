import z from 'zod';
import {
  SYSTEM_ACCOUNTING_STANDARDS,
  UAccountingStandardCode,
} from '../../../domain/accounting/config/accounting-standards.config';
import {
  SYSTEM_JURISDICTIONS,
  UJurisdictionCode,
} from '../../../domain/accounting/config/jurisdictions.config';
import {
  EAccountingEntityType,
  UAccountingEntityType,
} from '../../../domain/accounting/types/accounting-entity.types';
import {
  EPeriodUnit,
  UPeriodUnit,
} from '../../../domain/accounting/types/period.types';
import { UAppUsageModePreference } from '../../../domain/user/types/user-preferences.types';
import { currencyCodeValidation } from './money.dto';
import { userAppUsageModePreferenceValidation } from './user.dto';

/**
 * Jurisdiction code validation schema
 */
export const jurisdictionCodeValidation = z.enum(
  Object.keys(SYSTEM_JURISDICTIONS) as [
    UJurisdictionCode,
    ...UJurisdictionCode[],
  ],
  'Unsupported operating country code'
);

/**
 * Accounting entity type validation schema
 */
export const accountingEntityTypeValidation = z.enum(
  Object.values(EAccountingEntityType) as [
    UAccountingEntityType,
    ...UAccountingEntityType[],
  ],
  'Unsupported accounting entity type'
);

/**
 * Accounting standard code validation schema
 */
export const accountingStandardCodeValidation = z.enum(
  Object.keys(SYSTEM_ACCOUNTING_STANDARDS) as [
    UAccountingStandardCode,
    ...UAccountingStandardCode[],
  ],
  'Unsupported accounting standard code'
);

/**
 * Period day validation schema
 */
export const periodDayValidation = z.number().min(1).max(31);

/**
 * Period month validation schema
 */
export const periodMonthValidation = z.number().min(1).max(12);

export const periodUnitValidation = z.enum(
  Object.values(EPeriodUnit) as [UPeriodUnit, ...UPeriodUnit[]]
);

/**
 * Fiscal year creation DTO
 */
export interface IFiscalYearCreationDto {
  startDate: Date;
  endDate: Date;
}

/**
 * Fiscal year creation DTO schema
 */
export const fiscalYearCreationDtoSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

export interface IPeriodCreationDto {
  unit: UPeriodUnit;
  count: number;
}

export const periodCreationDtoSchema = z.object({
  unit: periodUnitValidation,
  count: z.number(),
});

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
export const accountingEntityOnboardingDtoSchema = z.object({
  name: z.string(),
  entityType: accountingEntityTypeValidation,
  jurisdictionCode: jurisdictionCodeValidation,
  accountingStandardCode: accountingStandardCodeValidation,
  functionalCurrencyCode: currencyCodeValidation,
  reportingCurrencyCode: currencyCodeValidation,
  fiscalYear: fiscalYearCreationDtoSchema,
  accountingPeriod: periodCreationDtoSchema,
  reportingPeriod: periodCreationDtoSchema,
  appUsageMode: userAppUsageModePreferenceValidation,
});

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
