import {
  IFiscalYearStart,
  UAccountingEntityType,
} from '../../../domain/accounting/types/accounting.types';
import { UAppUsageMode } from '../../../domain/user/types/user-preferences.types';

export interface IAccountingEntityOnboardingReq {
  name: string;
  entityType: UAccountingEntityType;
  operatingCountryCode: string;
  functionalCurrencyCode: string;
  reportingCurrencyCode: string;
  fiscalYearStart: IFiscalYearStart;
  appUsageMode: UAppUsageMode;
}
