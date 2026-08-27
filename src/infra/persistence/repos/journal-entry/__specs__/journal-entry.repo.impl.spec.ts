import { TEntityId } from '@shared/types/uuid';

import { journalEntriesInCore } from '@infra/config/drizzle/schema';
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
});
