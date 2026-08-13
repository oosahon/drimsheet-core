import { TEntityId } from '@shared/types/uuid';

import { IUserPreferences } from '@domain/user/types/user-preferences.types';

import { userPreferencesInCore } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import userPreferencesMapper from '@infra/persistence/repos/user/mappers/user-preferences.mapper';
import userPreferencesRepo from '@infra/persistence/repos/user/user-preferences.repo.impl';

jest.mock('../../../helpers/get-db-query');
jest.mock('../mappers/user-preferences.mapper');

describe('UserPreferencesRepoImpl', () => {
  const mockConflictQuery = {
    onConflictDoUpdate: jest.fn(),
  };
  const mockInsertQuery = {
    values: jest.fn(),
  };
  const mockQuery = {
    select: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    limit: jest.fn(),
    insert: jest.fn(),
  };
  const mockGetDbQuery = getDbQuery as jest.MockedFunction<typeof getDbQuery>;
  const mockUserPreferencesMapper = jest.mocked(userPreferencesMapper);

  beforeEach(() => {
    jest.clearAllMocks();

    mockQuery.select.mockReturnValue(mockQuery);
    mockQuery.from.mockReturnValue(mockQuery);
    mockQuery.where.mockReturnValue(mockQuery);
    mockQuery.insert.mockReturnValue(mockInsertQuery);
    mockInsertQuery.values.mockReturnValue(mockConflictQuery);
    mockGetDbQuery.mockReturnValue(
      mockQuery as unknown as ReturnType<typeof getDbQuery>
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should find user preferences by ID successfully', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
    const options = { correlationId: 'corr-id' };
    const mockRepoResult = {
      id: userId,
      lastActiveAccountingEntityId: null,
      appPreferences: { theme: 'dark' },
      createdAt: '2026-03-13T00:00:00.000Z',
      updatedAt: '2026-03-13T00:00:00.000Z',
    };
    const mockDomainResult: IUserPreferences = {
      id: userId,
      lastActiveAccountingEntityId: null,
      appPreferences: { theme: 'dark' },
      createdAt: new Date('2026-03-13T00:00:00.000Z'),
      updatedAt: new Date('2026-03-13T00:00:00.000Z'),
    };

    mockQuery.limit.mockResolvedValue([mockRepoResult]);
    mockUserPreferencesMapper.toDomain.mockReturnValue(mockDomainResult);

    const result = await userPreferencesRepo.findById(userId, options);

    expect(getDbQuery).toHaveBeenCalledWith(options);
    expect(mockQuery.select).toHaveBeenCalled();
    expect(mockQuery.from).toHaveBeenCalledWith(userPreferencesInCore);
    expect(mockQuery.where).toHaveBeenCalled();
    expect(mockQuery.limit).toHaveBeenCalledWith(1);
    expect(userPreferencesMapper.toDomain).toHaveBeenCalledWith(mockRepoResult);
    expect(result).toEqual(mockDomainResult);
  });

  it('should return null if no preferences row is found', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
    const options = { correlationId: 'corr-id' };

    mockQuery.limit.mockResolvedValue([]);

    const result = await userPreferencesRepo.findById(userId, options);

    expect(result).toBeNull();
    expect(userPreferencesMapper.toDomain).not.toHaveBeenCalled();
  });

  it('should upsert supplied user preference fields', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-13T12:00:00.000Z'));

    const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
    const accountingEntityId =
      '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
    const options = { correlationId: 'corr-id' };
    const updatedAt = '2026-08-13T12:00:00.000Z';
    const payload: Partial<IUserPreferences> = {
      appPreferences: { theme: 'dark' },
      lastActiveAccountingEntityId: accountingEntityId,
    };

    await userPreferencesRepo.update(userId, payload, options);

    expect(mockGetDbQuery).toHaveBeenCalledWith(options);
    expect(mockQuery.insert).toHaveBeenCalledWith(userPreferencesInCore);
    expect(mockInsertQuery.values).toHaveBeenCalledWith({
      id: userId,
      appPreferences: payload.appPreferences,
      lastActiveAccountingEntityId: accountingEntityId,
      updatedAt,
    });
    expect(mockConflictQuery.onConflictDoUpdate).toHaveBeenCalledWith({
      target: userPreferencesInCore.id,
      set: {
        appPreferences: payload.appPreferences,
        lastActiveAccountingEntityId: accountingEntityId,
        updatedAt,
      },
    });
  });

  it('should clear the last active accounting entity ID', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-13T12:00:00.000Z'));

    const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
    const options = { correlationId: 'corr-id' };
    const updatedAt = '2026-08-13T12:00:00.000Z';

    await userPreferencesRepo.update(
      userId,
      { lastActiveAccountingEntityId: null },
      options
    );

    expect(mockInsertQuery.values).toHaveBeenCalledWith({
      id: userId,
      lastActiveAccountingEntityId: null,
      updatedAt,
    });
    expect(mockConflictQuery.onConflictDoUpdate).toHaveBeenCalledWith({
      target: userPreferencesInCore.id,
      set: {
        lastActiveAccountingEntityId: null,
        updatedAt,
      },
    });
  });

  it('should ignore caller-supplied identity and lifecycle fields', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-13T12:00:00.000Z'));

    const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
    const suppliedId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
    const options = { correlationId: 'corr-id' };
    const updatedAt = '2026-08-13T12:00:00.000Z';

    await userPreferencesRepo.update(
      userId,
      {
        id: suppliedId,
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        updatedAt: new Date('2020-01-01T00:00:00.000Z'),
      },
      options
    );

    expect(mockInsertQuery.values).toHaveBeenCalledWith({
      id: userId,
      updatedAt,
    });
    expect(mockConflictQuery.onConflictDoUpdate).toHaveBeenCalledWith({
      target: userPreferencesInCore.id,
      set: { updatedAt },
    });
  });
});
