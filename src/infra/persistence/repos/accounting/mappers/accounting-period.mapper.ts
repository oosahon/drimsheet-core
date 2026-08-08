import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { TEntityId } from '@shared/types/uuid';

import { IAccountingPeriod } from '@domain/accounting/types/period.types';

import { accountingPeriodsInCore } from '@infra/config/drizzle/schema';
import {
  fromRepoDate,
  toRepoDate,
  toRepoDateOnly,
} from '@infra/persistence/helpers/date.mapper';

export interface IAccountingPeriodRepoModel extends InferInsertModel<
  typeof accountingPeriodsInCore
> {}

export interface IAccountingPeriodModel extends InferSelectModel<
  typeof accountingPeriodsInCore
> {}

const accountingPeriodMapper = {
  toRepo(domain: IAccountingPeriod): IAccountingPeriodRepoModel {
    return {
      id: domain.id,
      name: domain.name,
      accountingEntityId: domain.accountingEntityId,
      fiscalYearId: domain.fiscalYearId,
      unit: domain.unit,
      count: domain.count,
      startDate: toRepoDateOnly(domain.startDate),
      endDate: toRepoDateOnly(domain.endDate),
      status: domain.status,
      closedAt: domain.closedAt ? toRepoDate(domain.closedAt) : null,
      updatedAt: toRepoDate(domain.updatedAt),
    };
  },

  toDomain(payload: IAccountingPeriodModel): IAccountingPeriod {
    return Object.freeze({
      id: payload.id as TEntityId,
      name: payload.name,
      accountingEntityId: payload.accountingEntityId as TEntityId,
      fiscalYearId: payload.fiscalYearId as TEntityId,
      unit: payload.unit,
      count: payload.count,
      startDate: fromRepoDate(payload.startDate),
      endDate: fromRepoDate(payload.endDate),
      status: payload.status,
      closedAt: payload.closedAt ? fromRepoDate(payload.closedAt) : null,
      updatedAt: fromRepoDate(payload.updatedAt),
    });
  },
};

export default accountingPeriodMapper;
