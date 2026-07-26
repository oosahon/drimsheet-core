import z from 'zod';
import {
  SYSTEM_ACCOUNTING_STANDARDS,
  UAccountingStandardCode,
} from '../../../../domain/accounting/config/accounting-standards.config';
import {
  SYSTEM_JURISDICTIONS,
  UJurisdictionCode,
} from '../../../../domain/accounting/config/jurisdictions.config';
import { MAX_GENERATED_PERIODS } from '../../../../domain/accounting/config/period-limits.config';
import accountingError from '../../../../domain/accounting/errors/accounting.error';
import periodError from '../../../../domain/accounting/errors/period.error';
import {
  EAccountingEntityType,
  UAccountingEntityType,
} from '../../../../domain/accounting/types/accounting-entity.types';
import {
  EPeriodUnit,
  UPeriodUnit,
} from '../../../../domain/accounting/types/period.types';
import { currencyCodeValidation } from '../../../money/dtos/currency/currency.dto.validation';
import { userAppUsageModePreferenceValidation } from '../../../user/dtos/user/user.dto.validation';

/**
 * Jurisdiction code validation schema
 */
export const jurisdictionCodeValidation = z.enum(
  Object.keys(SYSTEM_JURISDICTIONS) as [
    UJurisdictionCode,
    ...UJurisdictionCode[],
  ],
  new accountingError.InvalidJurisdictionCode().errorKey
);

/**
 * Accounting entity type validation schema
 */
export const accountingEntityTypeValidation = z.enum(
  Object.values(EAccountingEntityType) as [
    UAccountingEntityType,
    ...UAccountingEntityType[],
  ],
  new accountingError.InvalidAccountingEntityType().errorKey
);

/**
 * Accounting standard code validation schema
 */
export const accountingStandardCodeValidation = z.enum(
  Object.keys(SYSTEM_ACCOUNTING_STANDARDS) as [
    UAccountingStandardCode,
    ...UAccountingStandardCode[],
  ],
  new accountingError.InvalidAccountingStandardCode().errorKey
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
 * Fiscal year creation DTO schema
 */
export const fiscalYearCreationDtoSchema = z
  .object({
    startDate: z.date(),
    endDate: z.date(),
  })
  .superRefine(({ startDate, endDate }, context) => {
    if (endDate <= startDate) {
      context.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: new periodError.InvalidDateRange().errorKey,
      });
    }
  });

export const periodCreationDtoSchema = z.object({
  unit: periodUnitValidation,
  count: z.number().int().positive().max(MAX_GENERATED_PERIODS),
});
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
