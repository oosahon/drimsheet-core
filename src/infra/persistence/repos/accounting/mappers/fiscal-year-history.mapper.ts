import { InferSelectModel } from 'drizzle-orm';
import { IFiscalYear } from '../../../../../domain/accounting/types/fiscal-year.types';
import { IFiscalYearHistory } from '../../../../../domain/accounting/types/period-audit.types';
import { fiscalYearHistoryInAudit } from '../../../../config/drizzle/schema';
import { toRepoDate } from '../../../helpers/date.mapper';

export interface IFiscalYearHistoryRepoModel extends InferSelectModel<
  typeof fiscalYearHistoryInAudit
> {}

const fiscalYearHistoryMapper = {
  toRepo(
    fiscalYear: IFiscalYear,
    history: IFiscalYearHistory
  ): Omit<IFiscalYearHistoryRepoModel, 'id' | 'recordedAt'> {
    return {
      fiscalYearId: history.entityId,
      accountingEntityId: fiscalYear.accountingEntityId,
      actorType: history.actor.type,
      action: history.action,
      userId: history.actor.userId,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: toRepoDate(history.occurredAt),
    };
  },
};

export default fiscalYearHistoryMapper;
