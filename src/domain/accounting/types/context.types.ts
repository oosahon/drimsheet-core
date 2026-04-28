import { TEntityId } from '../../../shared/types/uuid';
import { UCurrencyCode } from '../../currency/config/currencies.config';
import { UAccountingStandardCode } from '../config/accounting-standards.config';
import { UJurisdictionCode } from '../config/jurisdictions.config';

export interface IAccountingContext {
  id: TEntityId;
  name: string;
  description: string | null;
  accountingEntityId: TEntityId;
  functionalCurrencyCode: UCurrencyCode;
  jurisdictionCode: UJurisdictionCode;
  accountingStandardCode: UAccountingStandardCode;
  fiscalYearId: TEntityId;
  currentAccountingPeriodId: TEntityId;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}

export interface IReportingContext {
  id: TEntityId;
  name: string;
  description: string | null;
  accountingEntityId: TEntityId;
  reportingCurrencyCode: UCurrencyCode;
  accountingContextId: TEntityId;
  currentReportingPeriodId: TEntityId;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}
