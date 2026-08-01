import { TEntityId } from '../../../../../shared/types/uuid';
import { userPreferencesInCore } from '../../../../config/drizzle/schema';
import getDbQuery from '../../../helpers/get-db-query';
import userPreferencesMapper from '../mappers/user-preferences.mapper';
import userPreferencesRepo from '../user-preferences.repo.impl';

jest.mock('../../../helpers/get-db-query');
jest.mock('../../../mappers/user/user-preferences.mapper');

describe('UserPreferencesRepoImpl', () => {
  let mockQuery: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockQuery = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
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
      createdAt: '2026-03-13T00:00:00.000Z',
      updatedAt: '2026-03-13T00:00:00.000Z',
    };
    const mockDomainResult = {
      id: userId,
      appPreferences: { theme: 'dark' },
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

  it('should return null if no preferences row is found', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
    const options = { correlationId: 'corr-id' };

    mockQuery.limit.mockResolvedValue([]);

    const result = await userPreferencesRepo.findById(userId, options);

    expect(result).toBeNull();
    expect(userPreferencesMapper.toDomain).not.toHaveBeenCalled();
  });
});
