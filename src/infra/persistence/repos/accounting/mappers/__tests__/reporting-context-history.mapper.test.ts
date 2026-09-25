import { TEntityId } from '@shared/types/uuid';

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
      createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
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
      actorId: userId,
      onBehalfOf: null,
      correlationId: 'correlation-id-def',
    };

    expect(
      reportingContextHistoryMapper.toRepo(reportingContext, history)
    ).toEqual({
      reportingContextId,
      accountingEntityId,
      actorId: userId,
      onBehalfOf: null,
      action: 'updated',

      diff: history.diff,
      correlationId: 'correlation-id-def',
      occurredAt: toRepoDate(occurredAt),
    });
  });
});
