import { InferInsertModel } from 'drizzle-orm';

import { TEntityId } from '@shared/types/uuid';

import { IReportingContext } from '@domain/accounting/types/context.types';

import { reportingContextsInCore } from '@infra/config/drizzle/schema';
import { toRepoDate } from '@infra/persistence/helpers/date.mapper';

export interface IReportingContextRepoModel extends InferInsertModel<
  typeof reportingContextsInCore
> {}

const reportingContextMapper = {
  toRepo(domain: IReportingContext): IReportingContextRepoModel {
    return {
      createdBy: domain.createdBy as TEntityId,
      id: domain.id,
      name: domain.name,
      description: domain.description,
      accountingEntityId: domain.accountingEntityId,
      reportingCurrencyCode: domain.reportingCurrencyCode,
      accountingContextId: domain.accountingContextId,
      currentReportingPeriodId: domain.currentReportingPeriodId,
      accountingStandardCode: domain.accountingStandardCode,
      createdAt: toRepoDate(domain.createdAt),
      updatedAt: toRepoDate(domain.updatedAt),
      closedAt: domain.closedAt ? toRepoDate(domain.closedAt) : null,
    };
  },
};

export default reportingContextMapper;
