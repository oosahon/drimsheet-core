import {
  IAccountingEntity,
  IAccountingEntityHistory,
} from '../../../../../domain/accounting/types/accounting-entity.types';
import { IWriteRepoOptions } from '../../../../../shared/types/repo.types';
import getDbQuery from '../../../helpers/get-db-query';
import accountingEntityMapper from '../../../mappers/accounting/accounting-entity.mapper';
import accountingEntityHistoryRepo from '../accounting-entity-history.repo.impl';
import accountingEntityRepo from '../accounting-entity.repo.impl';

jest.mock('../../../helpers/get-db-query');
jest.mock('../../../mappers/accounting/accounting-entity.mapper');
jest.mock('../accounting-entity-history.repo.impl');

describe('AccountingEntityRepoImpl', () => {
  const domain = {
    id: '123e4567-e89b-12d3-a456-426614174001',
  } as IAccountingEntity;
  const options = {
    correlationId: 'correlation-id',
    history: [],
  } as unknown as IWriteRepoOptions<IAccountingEntityHistory>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    {
      code: '23505',
      constraint: 'accounting_entities_unique_individual_owner_idx',
    },
    {
      code: '08006',
      constraint: 'accounting_entities_unique_individual_owner_idx',
    },
    new Error('database unavailable'),
  ])('propagates database failures unchanged', async (databaseError) => {
    const query = {
      transaction: jest.fn().mockRejectedValue(databaseError),
    };
    (getDbQuery as jest.Mock).mockReturnValue(query);

    await expect(accountingEntityRepo.create(domain, options)).rejects.toBe(
      databaseError
    );
  });

  it('persists the entity and its history in the same transaction', async () => {
    const values = jest.fn().mockResolvedValue(undefined);
    const tx = {
      insert: jest.fn().mockReturnValue({ values }),
    };
    const query = {
      transaction: jest.fn(
        async (callback: (transaction: typeof tx) => Promise<void>) =>
          callback(tx)
      ),
    };
    const repoValue = { id: domain.id };
    (getDbQuery as jest.Mock).mockReturnValue(query);
    (accountingEntityMapper.toRepo as jest.Mock).mockReturnValue(repoValue);

    await accountingEntityRepo.create(domain, options);

    expect(values).toHaveBeenCalledWith(repoValue);
    expect(accountingEntityHistoryRepo.save).toHaveBeenCalledWith(
      domain,
      options.history,
      expect.objectContaining({
        correlationId: options.correlationId,
        tx,
      })
    );
  });
});
