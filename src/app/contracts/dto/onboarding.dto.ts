import z from 'zod';
import { UAccountingEntityType } from '../../../domain/accounting/types/accounting-entity.types';
import { IFiscalYear } from '../../../domain/accounting/types/period.types';
import { UAppUsageModePreference } from '../../../domain/user/types/user-preferences.types';
import {
  accountingEntityTypeValidation,
  jurisdictionCodeValidation,
  periodDayValidation,
  periodMonthValidation,
} from './accounting.dto';
import { currencyCodeValidation } from './money.dto';
import { userAppUsageModePreferenceValidation } from './user.dto';

export interface IAccountingEntityOnboardingReq {
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
  fiscalYearStart: z.object({
    month: periodMonthValidation,
    day: periodDayValidation,
  }),
  appUsageMode: userAppUsageModePreferenceValidation,
});
