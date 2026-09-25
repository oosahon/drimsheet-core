import { TEntityId } from '@shared/types/uuid';

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
      entityVersion: 1,
      action: 'created',
      diff: {
        before: null,
        after: {
          createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
        } as any,
      },
      occurredAt,
      actorId: userId,
      onBehalfOf: null,
      correlationId: 'correlation-id-mno',
    };

    expect(accountingEntityHistoryMapper.toRepo(history)).toEqual({
      accountingEntityId,
      actorId: userId,
      onBehalfOf: null,
      action: 'created',
      diff: history.diff,
      correlationId: 'correlation-id-mno',
      occurredAt: toRepoDate(occurredAt),
    });
  });
});
