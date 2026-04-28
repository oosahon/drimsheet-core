import z from 'zod';
import {
  SYSTEM_JURISDICTIONS,
  UJurisdictionCode,
} from '../../../domain/accounting/config/jurisdictions.config';
import {
  EAccountingEntityType,
  UAccountingEntityType,
} from '../../../domain/accounting/types/accounting-entity.types';
import { IFiscalYear } from '../../../domain/accounting/types/period.types';
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
 * Period day validation schema
 */
export const periodDayValidation = z.number().min(1).max(31);

/**
 * Period month validation schema
 */
export const periodMonthValidation = z.number().min(1).max(12);

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

/**
 * Accounting entity onboarding DTO
 */
export interface IAccountingEntityOnboardingDto {
  name: string;
  entityType: UAccountingEntityType;
  operatingCountryCode: string;
  functionalCurrencyCode: string;
  reportingCurrencyCode: string;
  fiscalYearStart: IFiscalYear;
  appUsageMode: UAppUsageModePreference;
}
export const accountingEntityOnboardingDtoSchema = z.object({
  name: z.string(),
  operatingCountryCode: jurisdictionCodeValidation,
  entityType: accountingEntityTypeValidation,
  functionalCurrencyCode: currencyCodeValidation,
  reportingCurrencyCode: currencyCodeValidation,
  fiscalYearStart: fiscalYearCreationDtoSchema,
  appUsageMode: userAppUsageModePreferenceValidation,
});
