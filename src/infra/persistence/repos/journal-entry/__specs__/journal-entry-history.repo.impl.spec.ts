import { TEntityId } from '@shared/types/uuid';

import getDbQuery from '@infra/persistence/helpers/get-db-query';
import journalEntryHistoryRepo from '@infra/persistence/repos/journal-entry/journal-entry-history.repo.impl';
import journalEntryHistoryMapper from '@infra/persistence/repos/journal-entry/mappers/journal-entry-history.mapper';

jest.mock('../../../helpers/get-db-query');
jest.mock('../mappers/journal-entry-history.mapper');

describe('journalEntryHistoryRepo', () => {
  const entryId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
  const options = { correlationId: 'correlation-id' };

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(journalEntryHistoryMapper.toRepo)
      .mockReturnValue({ id: entryId } as never);
  });

  it('creates history for single and multiple entries', async () => {
    const values = jest.fn().mockResolvedValue(undefined);
    const insert = jest.fn().mockReturnValue({ values });
    jest.mocked(getDbQuery).mockReturnValue({ insert } as never);

    await journalEntryHistoryRepo.create(
      { id: entryId } as never,
      { entityId: entryId } as never,
      options
    );
    await journalEntryHistoryRepo.create(
      [{ id: entryId }] as never,
      [{ entityId: entryId }] as never,
      options
    );

    expect(insert).toHaveBeenCalledTimes(2);
    expect(values).toHaveBeenCalledTimes(2);
  });
});
