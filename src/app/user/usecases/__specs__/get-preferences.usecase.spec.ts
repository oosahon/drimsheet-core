import mockUserPreferencesRepo from '../../../../domain/user/repos/__mocks__/user-preferences.repo.impl.mock';
import { IUserPreferences } from '../../../../domain/user/types/user-preferences.types';
import { IUser } from '../../../../domain/user/types/user.types';
import mockAppContext from '../../../../shared/contracts/__mocks__/app-context.contract.mock';
import { IAppContextData } from '../../../../shared/contracts/app-context.contract';
import { TEntityId } from '../../../../shared/types/uuid';
import makeGetUserPreferencesUseCase from '../get-preferences.usecase';

describe('makeGetUserPreferencesUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get user preferences successfully', async () => {
    const correlationId = 'test-corr-id';
    const mockUser = {
      id: 'test-user-id' as TEntityId,
    } as IUser;

    mockAppContext.get.mockReturnValue({
      correlationId,
      user: mockUser,
    } as IAppContextData);

    const mockPreferences = {
      id: 'prefs-id' as TEntityId,
      appPreferences: {
        theme: 'dark',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IUserPreferences;

    mockUserPreferencesRepo.findById.mockResolvedValue(mockPreferences);

    const usecase = makeGetUserPreferencesUseCase({
      appContext: mockAppContext,
      userPreferencesRepo: mockUserPreferencesRepo,
    });
    const result = await usecase();

    expect(mockAppContext.get).toHaveBeenCalledTimes(1);
    expect(mockUserPreferencesRepo.findById).toHaveBeenCalledWith(mockUser.id, {
      correlationId,
    });
    expect(result).toEqual(mockPreferences);
  });

  it('should throw appError.Unauthorized if user is not in request context', async () => {
    mockAppContext.get.mockReturnValue({} as IAppContextData);

    const usecase = makeGetUserPreferencesUseCase({
      appContext: mockAppContext,
      userPreferencesRepo: mockUserPreferencesRepo,
    });

    await expect(usecase()).rejects.toThrow('app_error_unauthorized');
    expect(mockAppContext.get).toHaveBeenCalledTimes(1);
    expect(mockUserPreferencesRepo.findById).not.toHaveBeenCalled();
  });
});
