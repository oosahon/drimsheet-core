import { TEntityId } from '@shared/types/uuid';
import repoError from '@shared/values/errors/repo.error';

import { journalEntriesInCore } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import journalEntryRepo from '@infra/persistence/repos/journal-entry/journal-entry.repo.impl';
import journalEntryHistoryMapper from '@infra/persistence/repos/journal-entry/mappers/journal-entry-history.mapper';
import journalEntryMapper from '@infra/persistence/repos/journal-entry/mappers/journal-entry.mapper';

jest.mock('../../../helpers/get-db-query');
jest.mock('../mappers/journal-entry-history.mapper');
jest.mock('../mappers/journal-entry.mapper');

describe('journalEntryRepo', () => {
  const findFirst = jest.fn();
  const query = {
    query: {
      journalEntriesInCore: {
        findFirst,
      },
    },
  };
  const options = { correlationId: 'test-correlation-id' };
  const journalEntryId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(journalEntryHistoryMapper.toRepo)
      .mockReturnValue({ id: journalEntryId } as never);
    jest
      .mocked(getDbQuery)
      .mockReturnValue(query as unknown as ReturnType<typeof getDbQuery>);
  });

  it('loads lines and the attachment collection before mapping', async () => {
    const repoResult = { id: journalEntryId };
    const entry = { id: journalEntryId };
    findFirst.mockResolvedValue(repoResult);
    jest
      .mocked(journalEntryMapper.toDomain)
      .mockReturnValue(entry as ReturnType<typeof journalEntryMapper.toDomain>);

    await expect(
      journalEntryRepo.findById(journalEntryId, options)
    ).resolves.toBe(entry);
    expect(findFirst).toHaveBeenCalledWith({
      where: expect.anything(),
      with: {
        journalEntryAttachmentsInCores: true,
        journalLinesInCores: true,
      },
    });
    expect(journalEntryMapper.toDomain).toHaveBeenCalledWith(repoResult);
    expect(journalEntriesInCore.id).toBeDefined();
  });

  it('returns null when the journal entry does not exist', async () => {
    findFirst.mockResolvedValue(undefined);

    await expect(
      journalEntryRepo.findById(journalEntryId, options)
    ).resolves.toBeNull();
    expect(journalEntryMapper.toDomain).not.toHaveBeenCalled();
  });

  it('creates entries and their history in a transaction', async () => {
    const values = jest.fn().mockResolvedValue(undefined);
    const insert = jest.fn().mockReturnValue({ values });
    const tx = { insert };
    jest.mocked(getDbQuery).mockReturnValue({
      transaction: jest.fn(async (callback) => callback(tx as never)),
      insert,
    } as never);

    await journalEntryRepo.create({ id: journalEntryId } as never, {
      ...options,
      history: { entityId: journalEntryId } as never,
    });
    await journalEntryRepo.create([{ id: journalEntryId }] as never, {
      ...options,
      history: [{ entityId: journalEntryId }] as never,
    });

    expect(tx.insert).toHaveBeenCalledWith(journalEntriesInCore);
  });

  it('updates entries and rejects stale versions', async () => {
    const values = jest.fn().mockResolvedValue(undefined);
    const where = jest.fn().mockResolvedValue({ rowCount: 1 });
    const set = jest.fn().mockReturnValue({ where });
    const tx = {
      update: jest.fn().mockReturnValue({ set }),
      insert: jest.fn().mockReturnValue({ values }),
    };
    jest.mocked(getDbQuery).mockReturnValue({
      transaction: jest.fn(async (callback) => callback(tx as never)),
      insert: jest.fn().mockReturnValue({ values }),
    } as never);

    await journalEntryRepo.update({ id: journalEntryId, version: 2 } as never, {
      ...options,
      expectedVersion: 1,
      history: { entityId: journalEntryId, entityVersion: 2 } as never,
    });

    where.mockResolvedValue({ rowCount: 0 });
    await expect(
      journalEntryRepo.update({ id: journalEntryId, version: 2 } as never, {
        ...options,
        expectedVersion: 1,
        history: { entityId: journalEntryId, entityVersion: 2 } as never,
      })
    ).rejects.toBeInstanceOf(repoError.VersionNotFound);
  });
});
