import { IEmployerHistory } from '../../../../../domain/counterparty/types/counterparty-audit.types';
import { IEmployer } from '../../../../../domain/counterparty/types/counterparty.types';
import { IWriteRepoOptions } from '../../../../../shared/types/repo.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import { counterpartyEmployersInCore } from '../../../../config/drizzle/schema';
import getDbQuery from '../../../helpers/get-db-query';
import employerHistoryRepo from '../employer-history.repo.impl';
import employerRepo from '../employer.repo.impl';
import employerMapper from '../mappers/employer.mapper';

jest.mock('../../../helpers/get-db-query');
jest.mock('../mappers/employer.mapper');
jest.mock('../employer-history.repo.impl');

describe('EmployerRepoImpl', () => {
  const now = new Date('2026-08-01T00:00:00.000Z');
  const payload: IEmployer = {
    counterPartyId: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
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
    entityId: payload.counterPartyId,
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

  const options: IWriteRepoOptions<IEmployerHistory> = {
    correlationId: 'test-correlation-id',
    history,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists employer and history in the same transaction', async () => {
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
    const repoValue = { counterpartyId: payload.counterPartyId };

    (getDbQuery as jest.Mock).mockReturnValue(query);
    (employerMapper.toRepo as jest.Mock).mockReturnValue(repoValue);

    await employerRepo.create(payload, options);

    expect(employerMapper.toRepo).toHaveBeenCalledWith(payload);
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledWith(counterpartyEmployersInCore);
    expect(valuesMock).toHaveBeenCalledWith(repoValue);

    expect(employerHistoryRepo.save).toHaveBeenCalledWith(
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

    await expect(employerRepo.create(payload, options)).rejects.toBe(
      databaseError
    );
  });
});
