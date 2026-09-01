import { TEntityId } from '@shared/types/uuid';
import { EHistoryActorType } from '@shared/values/history/types/history.types';

import { IFiscalYear } from '@domain/accounting/types/fiscal-year.types';
import { IFiscalYearHistory } from '@domain/accounting/types/period-audit.types';

import { toRepoDate } from '@infra/persistence/helpers/date.mapper';
import fiscalYearHistoryMapper from '@infra/persistence/repos/accounting/mappers/fiscal-year-history.mapper';

describe('fiscalYearHistoryMapper', () => {
  it('maps fiscal year history to the repository model', () => {
    const fiscalYearId = 'fiscal-year-uuid' as TEntityId;
    const accountingEntityId = 'accounting-entity-uuid' as TEntityId;
    const userId = 'user-uuid' as TEntityId;
    const occurredAt = new Date('2026-07-25T12:00:00.000Z');

    const fiscalYear: IFiscalYear = {
      accountingEntityId,
    } as IFiscalYear;

    const history: IFiscalYearHistory = {
      entityId: fiscalYearId,
      entityVersion: 1,
      action: 'created',
      diff: {
        before: null,
        after: fiscalYear,
      },
      occurredAt,
      actor: {
        type: EHistoryActorType.User,
        userId,
      },
      correlationId: 'correlation-id-ghi',
    };

    expect(fiscalYearHistoryMapper.toRepo(fiscalYear, history)).toEqual({
      fiscalYearId,
      accountingEntityId,
      actorType: EHistoryActorType.User,
      action: 'created',
      userId,
      diff: history.diff,
      correlationId: 'correlation-id-ghi',
      occurredAt: toRepoDate(occurredAt),
    });
  });
});
