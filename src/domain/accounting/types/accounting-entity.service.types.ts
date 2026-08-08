import { TEntityId } from '@shared/types/uuid';
import { TAuditedEntity } from '@shared/values/events/types/event.types';

import { UAccountingStandardCode } from '@domain/accounting/config/accounting-standards.config';
import { UJurisdictionCode } from '@domain/accounting/config/jurisdictions.config';
import { UCurrencyCode } from '@domain/money/config/currencies.config';

import {
  IAccountingEntity,
  UAccountingEntityType,
} from './accounting-entity.types';
import { IAccountingContext, IReportingContext } from './context.types';
import { IFiscalYear } from './fiscal-year.types';
import {
  IAccountingPeriod,
  IReportingPeriod,
  UPeriodUnit,
} from './period.types';

export interface IAccountingEntityCreationInput {
  name: string;
  type: UAccountingEntityType;
  ownerId: TEntityId;
  functionalCurrencyCode: UCurrencyCode;
  reportingCurrencyCode: UCurrencyCode;
  jurisdictionCode: UJurisdictionCode;
  accountingStandardCode: UAccountingStandardCode;
  fiscalYear: { startDate: Date; endDate: Date };
  accountingPeriod: { unit: UPeriodUnit; count: number };
  reportingPeriod: { unit: UPeriodUnit; count: number };
}

export interface IAccountingEntityCreationResult {
  accountingEntity: TAuditedEntity<
    IAccountingEntity,
    IAccountingEntity,
    IAccountingEntity
  >;
  fiscalYear: TAuditedEntity<IFiscalYear, IFiscalYear, IFiscalYear>;
  accountingPeriods: TAuditedEntity<
    IAccountingPeriod,
    IAccountingPeriod,
    IAccountingPeriod
  >[];
  accountingContext: TAuditedEntity<
    IAccountingContext,
    IAccountingContext,
    IAccountingContext
  >;
  reportingPeriods: TAuditedEntity<
    IReportingPeriod,
    IReportingPeriod,
    IReportingPeriod
  >[];
  reportingContext: TAuditedEntity<
    IReportingContext,
    IReportingContext,
    IReportingContext
  >;
}

export default interface IAccountingEntityService {
  create(
    input: IAccountingEntityCreationInput
  ): IAccountingEntityCreationResult;

  grantUserAccess(
    accountingEntity: IAccountingEntity,
    userId: TEntityId
  ): boolean;

  validateAccess(accountingEntity: IAccountingEntity, userId: TEntityId): void;
}
