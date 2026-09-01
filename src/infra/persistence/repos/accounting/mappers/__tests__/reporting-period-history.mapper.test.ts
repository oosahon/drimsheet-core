import { TEntityId } from '@shared/types/uuid';
import { EHistoryActorType } from '@shared/values/history/types/history.types';

import { IReportingPeriodHistory } from '@domain/accounting/types/period-audit.types';
import { IReportingPeriod } from '@domain/accounting/types/period.types';

import { toRepoDate } from '@infra/persistence/helpers/date.mapper';
import reportingPeriodHistoryMapper from '@infra/persistence/repos/accounting/mappers/reporting-period-history.mapper';

describe('reportingPeriodHistoryMapper', () => {
  it('maps reporting period history to the repository model', () => {
    const reportingPeriodId = 'reporting-period-uuid' as TEntityId;
    const accountingEntityId = 'accounting-entity-uuid' as TEntityId;
    const userId = 'user-uuid' as TEntityId;
    const occurredAt = new Date('2026-07-25T12:00:00.000Z');

    const reportingPeriod: IReportingPeriod = {
      accountingEntityId,
    } as IReportingPeriod;

    const history: IReportingPeriodHistory = {
      entityId: reportingPeriodId,
      entityVersion: 1,
      action: 'created',
      diff: {
        before: null,
        after: reportingPeriod,
      },
      occurredAt,
      actor: {
        type: EHistoryActorType.User,
        userId,
      },
      correlationId: 'correlation-id-abc',
    };

    expect(
      reportingPeriodHistoryMapper.toRepo(reportingPeriod, history)
    ).toEqual({
      reportingPeriodId,
      accountingEntityId,
      actorType: EHistoryActorType.User,
      action: 'created',
      userId,
      diff: history.diff,
      correlationId: 'correlation-id-abc',
      occurredAt: toRepoDate(occurredAt),
    });
  });
});
