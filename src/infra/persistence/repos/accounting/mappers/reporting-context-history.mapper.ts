import { InferSelectModel } from 'drizzle-orm';

import { IReportingContext } from '@domain/accounting/types/context.types';
import { IReportingContextHistory } from '@domain/accounting/types/reporting-context-audit.types';

import { reportingContextHistoryInAudit } from '@infra/config/drizzle/schema';
import { toRepoDate } from '@infra/persistence/helpers/date.mapper';

export interface IReportingContextHistoryRepoModel extends InferSelectModel<
  typeof reportingContextHistoryInAudit
> {}

const reportingContextHistoryMapper = {
  toRepo(
    reportingContext: IReportingContext,
    history: IReportingContextHistory
  ): Omit<IReportingContextHistoryRepoModel, 'id' | 'recordedAt'> {
    return {
      reportingContextId: history.entityId,
      accountingEntityId: reportingContext.accountingEntityId,
      action: history.action,
      actorId: history.actorId,
      onBehalfOf: history.onBehalfOf,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: toRepoDate(history.occurredAt),
    };
  },
};

export default reportingContextHistoryMapper;
