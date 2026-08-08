import { TEntityId } from '@shared/types/uuid';

import { ICounterpartyHistory } from '@domain/counterparty/types/counterparty-audit.types';
import { ICounterparty } from '@domain/counterparty/types/counterparty.types';

import counterpartyHistoryMapper from '@infra/persistence/repos/counterparty/mappers/counterparty-history.mapper';

describe('counterpartyHistoryMapper', () => {
  const now = new Date('2026-08-01T00:00:00.000Z');
  const counterparty: ICounterparty = {
    id: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    accountingEntityId: '123e4567-e89b-12d3-a456-426614174002' as TEntityId,
    name: 'Acme Corp',
    status: 'active',
    type: 'organization',
    roles: [],
    createdAt: now,
    updatedAt: now,
  };

  const history: ICounterpartyHistory = {
    entityId: counterparty.id,
    action: 'created',
    actor: {
      type: 'user',
      userId: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
    },
    diff: {
      before: null,
      after: counterparty,
    },
    correlationId: 'test-correlation-id',
    occurredAt: now,
  };

  it('maps counterparty and history to repo history model', () => {
    const result = counterpartyHistoryMapper.toRepo(counterparty, history);

    expect(result).toEqual({
      counterpartyId: counterparty.id,
      accountingEntityId: counterparty.accountingEntityId,
      actorType: 'user',
      action: 'created',
      userId: '123e4567-e89b-12d3-a456-426614174003',
      diff: history.diff,
      correlationId: 'test-correlation-id',
      occurredAt: now.toISOString(),
    });
  });
});
