import { TEntityId } from '@shared/types/uuid';

import {
  journalEntriesInCore,
  journalLinesInCore,
} from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import journalEntryRepo from '@infra/persistence/repos/journal-entry/journal-entry.repo.impl';
import journalEntryMapper from '@infra/persistence/repos/journal-entry/mappers/journal-entry.mapper';

jest.mock('../../../helpers/get-db-query');
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

  describe('findAll', () => {
    const accountingEntityId =
      '123e4567-e89b-12d3-a456-426614174002' as TEntityId;
    const accountId = '123e4567-e89b-12d3-a456-426614174003' as TEntityId;
    const findMany = jest.fn();

    function mockPaginatedQuery(total: number, entries: object[]) {
      const countWhere = jest.fn().mockResolvedValue([{ count: total }]);
      const countFrom = jest.fn().mockReturnValue({ where: countWhere });
      const select = jest.fn().mockReturnValue({ from: countFrom });

      jest.mocked(getDbQuery).mockReturnValue({
        select,
        query: {
          journalEntriesInCore: {
            findFirst,
            findMany: findMany.mockResolvedValue(entries),
          },
        },
      } as unknown as ReturnType<typeof getDbQuery>);

      return { countFrom, countWhere, select };
    }

    beforeEach(() => {
      findMany.mockReset();
    });

    it('returns an empty paginated response when no entries match', async () => {
      const { countFrom } = mockPaginatedQuery(0, []);

      await expect(
        journalEntryRepo.findAll(accountingEntityId, {
          correlationId: options.correlationId,
          limit: 25,
          offset: 25,
        })
      ).resolves.toEqual({
        data: [],
        meta: { page: 2, limit: 25, total: 0, totalPages: 0 },
      });
      expect(countFrom).toHaveBeenCalledWith(journalEntriesInCore);
      expect(findMany).not.toHaveBeenCalled();
    });

    it('paginates scoped headers and hydrates complete entries', async () => {
      const repoEntries = [{ id: journalEntryId }, { id: accountingEntityId }];
      const mappedEntries = [
        { id: journalEntryId },
        { id: accountingEntityId },
      ];
      mockPaginatedQuery(2, repoEntries);
      jest
        .mocked(journalEntryMapper.toDomain)
        .mockReturnValueOnce(
          mappedEntries[0] as ReturnType<typeof journalEntryMapper.toDomain>
        )
        .mockReturnValueOnce(
          mappedEntries[1] as ReturnType<typeof journalEntryMapper.toDomain>
        );

      const result = await journalEntryRepo.findAll(accountingEntityId, {
        correlationId: options.correlationId,
        limit: 10,
        offset: 0,
      });

      expect(findMany).toHaveBeenCalledWith({
        where: expect.anything(),
        with: {
          journalEntryAttachmentsInCores: true,
          journalLinesInCores: true,
        },
        orderBy: [expect.anything(), expect.anything()],
        limit: 10,
        offset: 0,
      });
      expect(journalEntryMapper.toDomain).toHaveBeenNthCalledWith(
        1,
        repoEntries[0],
        0,
        repoEntries
      );
      expect(journalEntryMapper.toDomain).toHaveBeenNthCalledWith(
        2,
        repoEntries[1],
        1,
        repoEntries
      );
      expect(result).toEqual({
        data: mappedEntries,
        meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
      });
    });

    it('filters headers through account participation and supports search and effective-date ordering', async () => {
      const countWhere = jest.fn().mockResolvedValue([{ count: 1 }]);
      const countFrom = jest.fn().mockReturnValue({ where: countWhere });
      const participantWhere = jest.fn().mockReturnValue({});
      const participantFrom = jest
        .fn()
        .mockReturnValue({ where: participantWhere });
      const select = jest
        .fn()
        .mockReturnValueOnce({ from: participantFrom })
        .mockReturnValueOnce({ from: countFrom });
      const repoEntry = { id: journalEntryId };
      const mappedEntry = { id: journalEntryId } as ReturnType<
        typeof journalEntryMapper.toDomain
      >;

      jest.mocked(getDbQuery).mockReturnValue({
        select,
        query: {
          journalEntriesInCore: {
            findFirst,
            findMany: findMany.mockResolvedValue([repoEntry]),
          },
        },
      } as unknown as ReturnType<typeof getDbQuery>);
      jest.mocked(journalEntryMapper.toDomain).mockReturnValue(mappedEntry);

      const result = await journalEntryRepo.findAll(accountingEntityId, {
        accountId,
        correlationId: options.correlationId,
        orderBy: 'effectiveDate',
        search: 'receipt',
        sortDirection: 'asc',
      });

      expect(participantFrom).toHaveBeenCalledWith(journalLinesInCore);
      expect(participantWhere).toHaveBeenCalledWith(expect.anything());
      expect(countFrom).toHaveBeenCalledWith(journalEntriesInCore);
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
          orderBy: [expect.anything(), expect.anything()],
          limit: 10,
          offset: 0,
        })
      );
      expect(result.data).toEqual([mappedEntry]);
    });
  });
});
