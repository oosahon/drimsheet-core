import { IContractorHistory } from '../../../../../domain/counterparty/types/counterparty-audit.types';
import { IContractor } from '../../../../../domain/counterparty/types/counterparty.types';
import { IWriteRepoOptions } from '../../../../../shared/types/repo.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import { counterpartyContractorsInCore } from '../../../../config/drizzle/schema';
import getDbQuery from '../../../helpers/get-db-query';
import contractorHistoryRepo from '../contractor-history.repo.impl';
import contractorRepo from '../contractor.repo.impl';
import contractorMapper from '../mappers/contractor.mapper';

jest.mock('../../../helpers/get-db-query');
jest.mock('../mappers/contractor.mapper');
jest.mock('../contractor-history.repo.impl');

describe('ContractorRepoImpl', () => {
  const now = new Date('2026-08-01T00:00:00.000Z');
  const payload: IContractor = {
    counterpartyId: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
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

  const history: IContractorHistory = {
    entityId: payload.counterpartyId,
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

  const options: IWriteRepoOptions<IContractorHistory> = {
    correlationId: 'test-correlation-id',
    history,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists contractor and history in the same transaction', async () => {
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
    (contractorMapper.toRepo as jest.Mock).mockReturnValue(repoValue);

    await contractorRepo.create(payload, options);

    expect(contractorMapper.toRepo).toHaveBeenCalledWith(payload);
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledWith(counterpartyContractorsInCore);
    expect(valuesMock).toHaveBeenCalledWith(repoValue);

    expect(contractorHistoryRepo.save).toHaveBeenCalledWith(
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

    await expect(contractorRepo.create(payload, options)).rejects.toBe(
      databaseError
    );
  });
});
