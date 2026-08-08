import { TEntityId } from '@shared/types/uuid';

import { IEmployerHistory } from '@domain/counterparty/types/counterparty-audit.types';
import { IEmployer } from '@domain/counterparty/types/counterparty.types';

import employerHistoryMapper from '@infra/persistence/repos/counterparty/mappers/employer-history.mapper';

describe('employerHistoryMapper', () => {
  const now = new Date('2026-08-01T00:00:00.000Z');
  const employer: IEmployer = {
    counterpartyId: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    displayName: 'Acme Corp Inc',
    address: {
      line1: '123 Main St',
      line2: 'Suite 100',
      city: 'Metropolis',
      region: 'NY',
      postalCode: '10001',
      countryCode: 'US',
    },
    createdAt: now,
  };

  const history: IEmployerHistory = {
    entityId: employer.counterpartyId,
    action: 'created',
    actor: {
      type: 'user',
      userId: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
    },
    diff: {
      before: null,
      after: employer,
    },
    correlationId: 'test-correlation-id',
    occurredAt: now,
  };

  it('maps history to repo history model', () => {
    const result = employerHistoryMapper.toRepo(history);

    expect(result).toEqual({
      counterpartyId: employer.counterpartyId,
      actorType: 'user',
      action: 'created',
      userId: '123e4567-e89b-12d3-a456-426614174003',
      diff: history.diff,
      correlationId: 'test-correlation-id',
      occurredAt: now.toISOString(),
    });
  });
});
