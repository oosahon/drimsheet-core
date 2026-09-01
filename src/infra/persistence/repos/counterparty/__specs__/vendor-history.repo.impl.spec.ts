import { TEntityId } from '@shared/types/uuid';

import { IVendorHistory } from '@domain/counterparty/types/counterparty-audit.types';

import { counterpartyVendorHistoryInAudit } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import vendorHistoryMapper from '@infra/persistence/repos/counterparty/mappers/vendor-history.mapper';
import vendorHistoryRepo from '@infra/persistence/repos/counterparty/vendor-history.repo.impl';

jest.mock('../../../helpers/get-db-query');
jest.mock('../mappers/vendor-history.mapper');

describe('VendorHistoryRepoImpl', () => {
  const now = new Date('2026-08-01T00:00:00.000Z');
  const history: IVendorHistory = {
    entityId: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    entityVersion: 1,
    action: 'created',
    actor: {
      type: 'user',
      userId: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
    },
    diff: {
      before: null,
      after: {
        counterpartyId: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
        address: null,
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
    (vendorHistoryMapper.toRepo as jest.Mock).mockReturnValue(mappedValue);

    await vendorHistoryRepo.save(history, {
      correlationId: 'test-correlation-id',
    });

    expect(vendorHistoryMapper.toRepo).toHaveBeenCalledWith(history);
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(db.insert).toHaveBeenCalledWith(counterpartyVendorHistoryInAudit);
    expect(values).toHaveBeenCalledWith(mappedValue);
  });
});
