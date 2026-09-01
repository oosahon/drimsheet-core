import { IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import { IVendorHistory } from '@domain/counterparty/types/counterparty-audit.types';
import { IVendor } from '@domain/counterparty/types/counterparty.types';

import { counterpartyVendorsInCore } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import vendorMapper from '@infra/persistence/repos/counterparty/mappers/vendor.mapper';
import vendorHistoryRepo from '@infra/persistence/repos/counterparty/vendor-history.repo.impl';
import vendorRepo from '@infra/persistence/repos/counterparty/vendor.repo.impl';

jest.mock('../../../helpers/get-db-query');
jest.mock('../mappers/vendor.mapper');
jest.mock('../vendor-history.repo.impl');

describe('VendorRepoImpl', () => {
  const now = new Date('2026-08-01T00:00:00.000Z');
  const payload: IVendor = {
    counterpartyId: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    address: null,
    createdAt: now,
  };

  const history: IVendorHistory = {
    entityId: payload.counterpartyId,
    entityVersion: 1,
    action: 'created',
    actor: {
      type: 'user',
      userId: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
    },
    diff: {
      before: null,
      after: payload,
    },
    correlationId: 'test-correlation-id',
    occurredAt: now,
  };

  const options: IWriteRepoOptions<IVendorHistory> = {
    correlationId: 'test-correlation-id',
    history,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists vendor and history in the same transaction', async () => {
    const valuesMock = jest.fn().mockResolvedValue(undefined);
    const insertMock = jest.fn().mockReturnValue({ values: valuesMock });
    const tx = {
      insert: insertMock,
    };
    const query = {
      transaction: jest.fn(
        async (callback: (transaction: typeof tx) => Promise<void>) =>
          callback(tx)
      ),
    };
    const repoValue = { counterpartyId: payload.counterpartyId };

    (getDbQuery as jest.Mock).mockReturnValue(query);
    (vendorMapper.toRepo as jest.Mock).mockReturnValue(repoValue);

    await vendorRepo.create(payload, options);

    expect(vendorMapper.toRepo).toHaveBeenCalledWith(payload);
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledWith(counterpartyVendorsInCore);
    expect(valuesMock).toHaveBeenCalledWith(repoValue);

    expect(vendorHistoryRepo.save).toHaveBeenCalledWith(
      options.history,
      expect.objectContaining({
        correlationId: options.correlationId,
        tx,
      })
    );
  });

  it('propagates database error when transaction fails', async () => {
    const databaseError = new Error('database failure');
    const query = {
      transaction: jest.fn().mockRejectedValue(databaseError),
    };
    (getDbQuery as jest.Mock).mockReturnValue(query);

    await expect(vendorRepo.create(payload, options)).rejects.toBe(
      databaseError
    );
  });
});
