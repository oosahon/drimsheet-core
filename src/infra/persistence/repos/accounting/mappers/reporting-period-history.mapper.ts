import { InferSelectModel } from 'drizzle-orm';
import { IReportingPeriodHistory } from '../../../../../domain/accounting/types/period-audit.types';
import { IReportingPeriod } from '../../../../../domain/accounting/types/period.types';
import { reportingPeriodHistoryInAudit } from '../../../../config/drizzle/schema';
import { toRepoDate } from '../../../helpers/date.mapper';

export interface IReportingPeriodHistoryRepoModel extends InferSelectModel<
  typeof reportingPeriodHistoryInAudit
> {}

const reportingPeriodHistoryMapper = {
  toRepo(
    reportingPeriod: IReportingPeriod,
    history: IReportingPeriodHistory
  ): Omit<IReportingPeriodHistoryRepoModel, 'id' | 'recordedAt'> {
    return {
      reportingPeriodId: history.entityId,
      accountingEntityId: reportingPeriod.accountingEntityId,
      actorType: history.actor.type,
      action: history.action,
      userId: history.actor.userId,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: toRepoDate(history.occurredAt),
    };
  },
};

export default reportingPeriodHistoryMapper;
