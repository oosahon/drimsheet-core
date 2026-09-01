import { TEntityId } from '@shared/types/uuid';
import { EHistoryActorType } from '@shared/values/history/types/history.types';

import { IReportingContext } from '@domain/accounting/types/context.types';
import { IReportingContextHistory } from '@domain/accounting/types/reporting-context-audit.types';

import { toRepoDate } from '@infra/persistence/helpers/date.mapper';
import reportingContextHistoryMapper from '@infra/persistence/repos/accounting/mappers/reporting-context-history.mapper';

describe('reportingContextHistoryMapper', () => {
  it('maps reporting context history to the repository model', () => {
    const reportingContextId = 'reporting-context-uuid' as TEntityId;
    const accountingEntityId = 'accounting-entity-uuid' as TEntityId;
    const userId = 'user-uuid' as TEntityId;
    const occurredAt = new Date('2026-07-25T12:00:00.000Z');

    const reportingContext: IReportingContext = {
      accountingEntityId,
    } as IReportingContext;

    const history: IReportingContextHistory = {
      entityId: reportingContextId,
      entityVersion: 1,
      action: 'updated',
      diff: {
        before: null,
        after: reportingContext,
      },
      occurredAt,
      actor: {
        type: EHistoryActorType.User,
        userId,
      },
      correlationId: 'correlation-id-def',
    };

    expect(
      reportingContextHistoryMapper.toRepo(reportingContext, history)
    ).toEqual({
      reportingContextId,
      accountingEntityId,
      actorType: EHistoryActorType.User,
      action: 'updated',
      userId,
      diff: history.diff,
      correlationId: 'correlation-id-def',
      occurredAt: toRepoDate(occurredAt),
    });
  });
});
