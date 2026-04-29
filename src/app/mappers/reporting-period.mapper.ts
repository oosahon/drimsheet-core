import { InferInsertModel } from 'drizzle-orm';
import { IReportingPeriod } from '../../domain/accounting/types/period.types';
import { reportingPeriodsInCore } from '../../infra/config/drizzle/schema';
import { toRepoDate, toRepoDateOnly } from './date';

export interface IReportingPeriodRepoModel extends InferInsertModel<
  typeof reportingPeriodsInCore
> {}

const reportingPeriodMapper = {
  toRepo(domain: IReportingPeriod): IReportingPeriodRepoModel {
    return {
      id: domain.id,
      name: domain.name,
      accountingEntityId: domain.accountingEntityId,
      fiscalYearId: domain.fiscalYearId,
      unit: domain.unit,
      count: domain.count,
      startDate: toRepoDateOnly(domain.startDate),
      endDate: toRepoDateOnly(domain.endDate),
      updatedAt: toRepoDate(domain.updatedAt),
    };
  },
};

export default reportingPeriodMapper;
