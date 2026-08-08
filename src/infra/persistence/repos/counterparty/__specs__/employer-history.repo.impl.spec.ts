import { TEntityId } from '@shared/types/uuid';

import { IEmployerHistory } from '@domain/counterparty/types/counterparty-audit.types';

import { counterpartyEmployerHistoryInAudit } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import employerHistoryRepo from '@infra/persistence/repos/counterparty/employer-history.repo.impl';
import employerHistoryMapper from '@infra/persistence/repos/counterparty/mappers/employer-history.mapper';

jest.mock('../../../helpers/get-db-query');
jest.mock('../mappers/employer-history.mapper');

describe('EmployerHistoryRepoImpl', () => {
  const now = new Date('2026-08-01T00:00:00.000Z');
  const history: IEmployerHistory = {
    entityId: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    action: 'created',
    actor: {
      type: 'user',
      userId: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
    },
    diff: {
      before: null,
      after: {
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
      },
    },
    correlationId: 'test-correlation-id',
    occurredAt: now,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts mapped history record', async () => {
    const values = jest.fn().mockResolvedValue(undefined);
    const db = {
      insert: jest.fn().mockReturnValue({ values }),
    };
    (getDbQuery as jest.Mock).mockReturnValue(db);
    const mappedValue = { counterpartyId: history.entityId };
    (employerHistoryMapper.toRepo as jest.Mock).mockReturnValue(mappedValue);

    await employerHistoryRepo.save(history, {
      correlationId: 'test-correlation-id',
    });

    expect(employerHistoryMapper.toRepo).toHaveBeenCalledWith(history);
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(db.insert).toHaveBeenCalledWith(counterpartyEmployerHistoryInAudit);
    expect(values).toHaveBeenCalledWith(mappedValue);
  });
});
