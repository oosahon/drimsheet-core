import { InferInsertModel } from 'drizzle-orm';
import { IAccountingContext } from '../../../../domain/accounting/types/context.types';
import { accountingContextsInCore } from '../../../config/drizzle/schema';
import { toRepoDate } from '../shared/date';

export interface IAccountingContextRepoModel extends InferInsertModel<
  typeof accountingContextsInCore
> {}

const accountingContextMapper = {
  toRepo(domain: IAccountingContext): IAccountingContextRepoModel {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      accountingEntityId: domain.accountingEntityId,
      accountingStandardCode: domain.accountingStandardCode,
      fiscalYearId: domain.fiscalYearId,
      currentOperatingPeriodId: domain.currentAccountingPeriodId,
      createdAt: toRepoDate(domain.createdAt),
      updatedAt: toRepoDate(domain.updatedAt),
      closedAt: domain.closedAt ? toRepoDate(domain.closedAt) : null,
    };
  },
};

export default accountingContextMapper;
