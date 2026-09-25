import { InferInsertModel } from 'drizzle-orm';

import { IFiscalYear } from '@domain/accounting/types/fiscal-year.types';

import { fiscalYearsInCore } from '@infra/config/drizzle/schema';
import {
  toRepoDate,
  toRepoDateOnly,
} from '@infra/persistence/helpers/date.mapper';

export interface IFiscalYearRepoModel extends InferInsertModel<
  typeof fiscalYearsInCore
> {}

const fiscalYearMapper = {
  toRepo(domain: IFiscalYear): IFiscalYearRepoModel {
    return {
      id: domain.id,
      createdBy: domain.createdBy,
      name: domain.name,
      accountingEntityId: domain.accountingEntityId,
      unit: 'month',
      count: 12,
      startDate: toRepoDateOnly(domain.startDate),
      endDate: toRepoDateOnly(domain.endDate),
      status: domain.status,
      closedAt: domain.closedAt ? toRepoDate(domain.closedAt) : null,
      updatedAt: toRepoDate(domain.updatedAt),
    };
  },
};

export default fiscalYearMapper;
