import {
  IAccountingEntity,
  IAccountingEntityHistory,
} from '../../../../../domain/accounting/types/accounting-entity.types';
import { IWriteRepoOptions } from '../../../../../shared/types/repo.types';
import getDbQuery from '../../../helpers/get-db-query';
import accountingEntityHistoryRepo from '../accounting-entity-history.repo.impl';
import accountingEntityRepo from '../accounting-entity.repo.impl';
import accountingEntityMapper from '../mappers/accounting-entity.mapper';

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

  describe('reads', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174002';
    const repoRow = { id: domain.id, ownerId: userId };
    const mappedEntity = { ...domain, ownerId: userId } as IAccountingEntity;

    function mockSelect(results: unknown[]) {
      const where = jest.fn().mockResolvedValue(results);
      const from = jest.fn().mockReturnValue({ where });
      const select = jest.fn().mockReturnValue({ from });
      (getDbQuery as jest.Mock).mockReturnValue({ select });
      return { select, from, where };
    }

    beforeEach(() => {
      (accountingEntityMapper.toDomain as jest.Mock).mockReturnValue(
        mappedEntity
      );
    });

    it('finds and maps an entity by ID', async () => {
      const query = mockSelect([repoRow]);

      const result = await accountingEntityRepo.findById(domain.id, options);

      expect(query.select).toHaveBeenCalledTimes(1);
      expect(query.where).toHaveBeenCalledTimes(1);
      expect(accountingEntityMapper.toDomain).toHaveBeenCalledWith(repoRow);
      expect(result).toBe(mappedEntity);
    });

    it('returns null when an entity ID does not exist', async () => {
      mockSelect([]);

      await expect(
        accountingEntityRepo.findById(domain.id, options)
      ).resolves.toBeNull();
      expect(accountingEntityMapper.toDomain).not.toHaveBeenCalled();
    });

    it('finds an entity using an atomic ID and owner filter', async () => {
      const query = mockSelect([repoRow]);

      const result = await accountingEntityRepo.findByIdAndUserId(
        domain.id,
        userId as IAccountingEntity['ownerId'],
        options
      );

      expect(query.where).toHaveBeenCalledTimes(1);
      expect(accountingEntityMapper.toDomain).toHaveBeenCalledWith(repoRow);
      expect(result).toBe(mappedEntity);
    });

    it('does not map a missing ID and owner match', async () => {
      mockSelect([]);

      await expect(
        accountingEntityRepo.findByIdAndUserId(
          domain.id,
          userId as IAccountingEntity['ownerId'],
          options
        )
      ).resolves.toBeNull();
      expect(accountingEntityMapper.toDomain).not.toHaveBeenCalled();
    });

    it('maps every entity owned by a user', async () => {
      const secondRow = { id: 'second-id', ownerId: userId };
      const secondEntity = { ...mappedEntity, id: 'second-id' };
      mockSelect([repoRow, secondRow]);
      (accountingEntityMapper.toDomain as jest.Mock)
        .mockReturnValueOnce(mappedEntity)
        .mockReturnValueOnce(secondEntity);

      const result = await accountingEntityRepo.findByUserId(
        userId as IAccountingEntity['ownerId'],
        options,
        'individual'
      );

      expect(
        (accountingEntityMapper.toDomain as jest.Mock).mock.calls.map(
          ([payload]) => payload
        )
      ).toEqual([repoRow, secondRow]);
      expect(result).toEqual([mappedEntity, secondEntity]);
    });

    it('finds user entities without an optional type filter', async () => {
      const query = mockSelect([repoRow]);

      const result = await accountingEntityRepo.findByUserId(
        userId as IAccountingEntity['ownerId'],
        options
      );

      expect(query.where).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mappedEntity]);
    });

    it('propagates read failures', async () => {
      const databaseError = new Error('database unavailable');
      const where = jest.fn().mockRejectedValue(databaseError);
      const from = jest.fn().mockReturnValue({ where });
      const select = jest.fn().mockReturnValue({ from });
      (getDbQuery as jest.Mock).mockReturnValue({ select });

      await expect(
        accountingEntityRepo.findByIdAndUserId(
          domain.id,
          userId as IAccountingEntity['ownerId'],
          options
        )
      ).rejects.toBe(databaseError);
    });
  });
});
