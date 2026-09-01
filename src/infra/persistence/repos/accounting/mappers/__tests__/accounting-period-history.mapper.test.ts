import { TEntityId } from '@shared/types/uuid';
import { EHistoryActorType } from '@shared/values/history/types/history.types';

import { IAccountingPeriodHistory } from '@domain/accounting/types/period-audit.types';
import { IAccountingPeriod } from '@domain/accounting/types/period.types';

import { toRepoDate } from '@infra/persistence/helpers/date.mapper';
import accountingPeriodHistoryMapper from '@infra/persistence/repos/accounting/mappers/accounting-period-history.mapper';

describe('accountingPeriodHistoryMapper', () => {
  it('maps accounting period history to the repository model', () => {
    const accountingPeriodId = 'accounting-period-uuid' as TEntityId;
    const accountingEntityId = 'accounting-entity-uuid' as TEntityId;
    const userId = 'user-uuid' as TEntityId;
    const occurredAt = new Date('2026-07-25T12:00:00.000Z');

    const period: IAccountingPeriod = {
      accountingEntityId,
    } as IAccountingPeriod;

    const history: IAccountingPeriodHistory = {
      entityId: accountingPeriodId,
      entityVersion: 1,
      action: 'created',
      diff: {
        before: null,
        after: period,
      },
      occurredAt,
      actor: {
        type: EHistoryActorType.User,
        userId,
      },
      correlationId: 'correlation-id-jkl',
    };

    expect(accountingPeriodHistoryMapper.toRepo(period, history)).toEqual({
      accountingPeriodId,
      accountingEntityId,
      actorType: EHistoryActorType.User,
      action: 'created',
      userId,
      diff: history.diff,
      correlationId: 'correlation-id-jkl',
      occurredAt: toRepoDate(occurredAt),
    });
  });
});
