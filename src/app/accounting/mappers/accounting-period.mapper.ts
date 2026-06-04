import { InferInsertModel } from 'drizzle-orm';
import { IAccountingPeriod } from '../../../domain/accounting/types/period.types';
import { accountingPeriodsInCore } from '../../../infra/config/drizzle/schema';
import { toRepoDate, toRepoDateOnly } from '../../shared/mappers/date';

export interface IAccountingPeriodRepoModel extends InferInsertModel<
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
};

export default accountingPeriodMapper;
