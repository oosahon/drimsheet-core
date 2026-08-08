import { TEntityId } from '@shared/types/uuid';
import { EHistoryActorType } from '@shared/values/history/types/history.types';

import { IAccountingEntityAuditHistory } from '@domain/accounting/types/accounting-entity-audit.types';

import { toRepoDate } from '@infra/persistence/helpers/date.mapper';
import accountingEntityHistoryMapper from '@infra/persistence/repos/accounting/mappers/accounting-entity-history.mapper';

describe('accountingEntityHistoryMapper', () => {
  it('maps accounting entity history to the repository model', () => {
    const accountingEntityId = 'accounting-entity-uuid' as TEntityId;
    const userId = 'user-uuid' as TEntityId;
    const occurredAt = new Date('2026-07-25T12:00:00.000Z');

    const history: IAccountingEntityAuditHistory = {
      entityId: accountingEntityId,
      action: 'created',
      diff: {
        before: null,
        after: {} as any,
      },
      occurredAt,
      actor: {
        type: EHistoryActorType.User,
        userId,
      },
      correlationId: 'correlation-id-mno',
    };

    expect(accountingEntityHistoryMapper.toRepo(history)).toEqual({
      accountingEntityId,
      actorType: EHistoryActorType.User,
      action: 'created',
      userId,
      diff: history.diff,
      correlationId: 'correlation-id-mno',
      occurredAt: toRepoDate(occurredAt),
    });
  });
});
