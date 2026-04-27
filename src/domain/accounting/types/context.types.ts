import { TEntityId } from '../../../shared/types/uuid';
import { UCurrencyCode } from '../../currency/config/currencies.config';
import { UAccountingStandardCode } from '../config/accounting-standards.config';
import { UJurisdictionCode } from '../config/jurisdictions.config';

export interface IAccountingContext {
  id: TEntityId;
  accountEntityId: TEntityId;
  functionalCurrencyCode: UCurrencyCode;
  jurisdictionCode: UJurisdictionCode;
  accountingStandardCode: UAccountingStandardCode;
  fiscalYearId: TEntityId;
  currentPeriodId: TEntityId;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}

export interface IReportingContext {
  id: TEntityId;
  accountEntityId: TEntityId;
  reportingCurrencyCode: UCurrencyCode;
  accountingContextId: TEntityId;
  currentPeriodId: TEntityId;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}
