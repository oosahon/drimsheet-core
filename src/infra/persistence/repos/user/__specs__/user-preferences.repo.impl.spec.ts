import { TEntityId } from '@shared/types/uuid';

import { userPreferencesInCore } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import userPreferencesMapper from '@infra/persistence/repos/user/mappers/user-preferences.mapper';
import userPreferencesRepo from '@infra/persistence/repos/user/user-preferences.repo.impl';

jest.mock('../../../helpers/get-db-query');
jest.mock('../mappers/user-preferences.mapper');

describe('UserPreferencesRepoImpl', () => {
  let mockQuery: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockQuery = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      for: jest.fn().mockReturnThis(),
      limit: jest.fn(),
    };

    (getDbQuery as jest.Mock).mockReturnValue(mockQuery);
  });

  it('should find user preferences by ID successfully', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
    const options = { correlationId: 'corr-id' };
    const mockRepoResult = {
      id: userId,
      appPreferences: { theme: 'dark' },
      lastActiveAccountingEntityId: null,
      createdAt: '2026-03-13T00:00:00.000Z',
      updatedAt: '2026-03-13T00:00:00.000Z',
    };
    const mockDomainResult = {
      id: userId,
      appPreferences: { theme: 'dark' },
      lastActiveAccountingEntityId: null,
      createdAt: new Date('2026-03-13T00:00:00.000Z'),
      updatedAt: new Date('2026-03-13T00:00:00.000Z'),
    };

    mockQuery.limit.mockResolvedValue([mockRepoResult]);
    (userPreferencesMapper.toDomain as jest.Mock).mockReturnValue(
      mockDomainResult
    );

    const result = await userPreferencesRepo.findById(userId, options);

    expect(getDbQuery).toHaveBeenCalledWith(options);
    expect(mockQuery.select).toHaveBeenCalled();
    expect(mockQuery.from).toHaveBeenCalledWith(userPreferencesInCore);
    expect(mockQuery.where).toHaveBeenCalled();
    expect(mockQuery.limit).toHaveBeenCalledWith(1);
    expect(userPreferencesMapper.toDomain).toHaveBeenCalledWith(mockRepoResult);
    expect(result).toEqual(mockDomainResult);
  });

  it('should create user preferences with the supplied repo options', async () => {
    const preferences = {
      id: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
      appPreferences: {},
      lastActiveAccountingEntityId: null,
      createdAt: new Date('2026-03-13T00:00:00.000Z'),
      updatedAt: new Date('2026-03-13T00:00:00.000Z'),
    };
    const options = { correlationId: 'corr-id', tx: {} };
    const repoValue = { id: preferences.id };
    (userPreferencesMapper.toRepo as jest.Mock).mockReturnValue(repoValue);

    await userPreferencesRepo.create(preferences, options);

    expect(getDbQuery).toHaveBeenCalledWith(options);
    expect(mockQuery.insert).toHaveBeenCalledWith(userPreferencesInCore);
    expect(mockQuery.values).toHaveBeenCalledWith(repoValue);
  });

  it('should update complete user preferences with the supplied repo options', async () => {
    const preferences = {
      id: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
      appPreferences: { theme: 'dark' as const },
      lastActiveAccountingEntityId:
        '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
      createdAt: new Date('2026-03-13T00:00:00.000Z'),
      updatedAt: new Date('2026-03-14T00:00:00.000Z'),
    };
    const options = { correlationId: 'corr-id', tx: {} };
    const repoValue = { id: preferences.id };
    (userPreferencesMapper.toRepo as jest.Mock).mockReturnValue(repoValue);

    await userPreferencesRepo.update(preferences, options);

    expect(getDbQuery).toHaveBeenCalledWith(options);
    expect(mockQuery.update).toHaveBeenCalledWith(userPreferencesInCore);
    expect(mockQuery.set).toHaveBeenCalledWith(repoValue);
    expect(mockQuery.where).toHaveBeenCalledTimes(1);
  });

  it('should return null if no preferences row is found', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
    const options = { correlationId: 'corr-id' };

    mockQuery.limit.mockResolvedValue([]);

    const result = await userPreferencesRepo.findById(userId, options);

    expect(result).toBeNull();
    expect(userPreferencesMapper.toDomain).not.toHaveBeenCalled();
  });

  it('should apply an update lock when requested', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
    mockQuery.limit.mockResolvedValue([]);

    await userPreferencesRepo.findById(userId, {
      correlationId: 'corr-id',
      lock: 'update',
    });

    expect(mockQuery.for).toHaveBeenCalledWith('update');
  });
});
