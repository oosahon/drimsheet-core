import { TEntityId } from '@shared/types/uuid';

import { IUserPreferences } from '@app/user/contracts/user-preferences.types';

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
  const mockSetQuery = {
    where: jest.fn(),
  };
  const mockUpdateQuery = {
    set: jest.fn(),
  };
  const mockQuery = {
    select: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    limit: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  };
  const mockGetDbQuery = jest.mocked(getDbQuery);
  const mockUserPreferencesMapper = jest.mocked(userPreferencesMapper);

  beforeEach(() => {
    jest.clearAllMocks();

    mockQuery.select.mockReturnValue(mockQuery);
    mockQuery.from.mockReturnValue(mockQuery);
    mockQuery.where.mockReturnValue(mockQuery);
    mockQuery.insert.mockReturnValue(mockInsertQuery);
    mockInsertQuery.values.mockReturnValue(mockConflictQuery);
    mockQuery.update.mockReturnValue(mockUpdateQuery);
    mockUpdateQuery.set.mockReturnValue(mockSetQuery);
    mockGetDbQuery.mockReturnValue(
      mockQuery as unknown as ReturnType<typeof getDbQuery>
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('finds user preferences by ID', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
    const options = { correlationId: 'corr-id' };
    const repoResult = {
      id: userId,
      lastActiveAccountingEntityId: null,
      appPreferences: { theme: 'dark' },
      createdAt: '2026-03-13T00:00:00.000Z',
      updatedAt: '2026-03-13T00:00:00.000Z',
    };
    const preferences: IUserPreferences = {
      userId,
      lastActiveAccountingEntityId: null,
      appPreferences: { theme: 'dark' },
      createdAt: new Date('2026-03-13T00:00:00.000Z'),
      updatedAt: new Date('2026-03-13T00:00:00.000Z'),
    };

    mockQuery.limit.mockResolvedValue([repoResult]);
    mockUserPreferencesMapper.toDomain.mockReturnValue(preferences);

    const result = await userPreferencesRepo.findById(userId, options);

    expect(getDbQuery).toHaveBeenCalledWith(options);
    expect(mockQuery.select).toHaveBeenCalled();
    expect(mockQuery.from).toHaveBeenCalledWith(userPreferencesInCore);
    expect(mockQuery.where).toHaveBeenCalled();
    expect(mockQuery.limit).toHaveBeenCalledWith(1);
    expect(userPreferencesMapper.toDomain).toHaveBeenCalledWith(repoResult);
    expect(result).toEqual(preferences);
  });

  it('creates preferences and updates them on conflict', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
    const accountingEntityId =
      '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
    const options = { correlationId: 'corr-id' };
    const preferences: IUserPreferences = {
      userId,
      lastActiveAccountingEntityId: accountingEntityId,
      appPreferences: { appUsageMode: 'non_power_user' },
      createdAt: new Date('2026-08-19T12:00:00.000Z'),
      updatedAt: new Date('2026-08-19T12:00:00.000Z'),
    };
    const preferenceValues = {
      id: userId,
      lastActiveAccountingEntityId: accountingEntityId,
      appPreferences: { appUsageMode: 'non_power_user' },
      createdAt: '2026-08-19T12:00:00.000Z',
      updatedAt: '2026-08-19T12:00:00.000Z',
    };
    mockUserPreferencesMapper.toRepo.mockReturnValue(preferenceValues);

    await userPreferencesRepo.create(preferences, options);

    expect(mockGetDbQuery).toHaveBeenCalledWith(options);
    expect(mockUserPreferencesMapper.toRepo).toHaveBeenCalledWith(preferences);
    expect(mockQuery.insert).toHaveBeenCalledWith(userPreferencesInCore);
    expect(mockInsertQuery.values).toHaveBeenCalledWith(preferenceValues);
    expect(mockConflictQuery.onConflictDoUpdate).toHaveBeenCalledWith({
      target: userPreferencesInCore.id,
      set: {
        appPreferences: preferenceValues.appPreferences,
        lastActiveAccountingEntityId: accountingEntityId,
        updatedAt: preferenceValues.updatedAt,
      },
    });
  });

  it('returns null when no preferences row is found', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
    const options = { correlationId: 'corr-id' };

    mockQuery.limit.mockResolvedValue([]);

    const result = await userPreferencesRepo.findById(userId, options);

    expect(result).toBeNull();
    expect(userPreferencesMapper.toDomain).not.toHaveBeenCalled();
  });

  it('updates user preferences', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-13T12:00:00.000Z'));

    const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
    const accountingEntityId =
      '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
    const options = { correlationId: 'corr-id' };
    const updatedAt = '2026-08-13T12:00:00.000Z';

    await userPreferencesRepo.update(
      { userId, lastActiveAccountingEntityId: accountingEntityId },
      options
    );

    expect(mockGetDbQuery).toHaveBeenCalledWith(options);
    expect(mockQuery.update).toHaveBeenCalledWith(userPreferencesInCore);
    expect(mockUpdateQuery.set).toHaveBeenCalledWith({
      lastActiveAccountingEntityId: accountingEntityId,
      updatedAt,
    });
    expect(mockSetQuery.where).toHaveBeenCalled();
  });

  it('clears the last active accounting entity ID', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-13T12:00:00.000Z'));

    const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
    const options = { correlationId: 'corr-id' };
    const updatedAt = '2026-08-13T12:00:00.000Z';

    await userPreferencesRepo.update(
      { userId, lastActiveAccountingEntityId: null },
      options
    );

    expect(mockUpdateQuery.set).toHaveBeenCalledWith({
      lastActiveAccountingEntityId: null,
      updatedAt,
    });
    expect(mockSetQuery.where).toHaveBeenCalled();
  });
});
