import { IUserPreferences } from '../../../../domain/user/types/user-preferences.types';
import { IUser } from '../../../../domain/user/types/user.types';
import { MockUserPreferencesRepo } from '../../../../infra/persistence/repos/__mocks__/user-preferences.repo.impl.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import { ErrorUnauthorized } from '../../../../shared/value-objects/error';
import MockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import getUserPreferencesUseCase from '../get-preferences.usecase';

describe('getUserPreferencesUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get user preferences successfully', async () => {
    const correlationId = 'test-corr-id';
    const mockUser = {
      id: 'test-user-id' as TEntityId,
    } as IUser;

    MockRequestContext.get.mockReturnValue({
      correlationId,
      user: mockUser,
    } as IRequestContextData);

    const mockPreferences = {
      id: 'prefs-id' as TEntityId,
      appPreferences: {
        theme: 'dark',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IUserPreferences;

    MockUserPreferencesRepo.findById.mockResolvedValue(mockPreferences);

    const usecase = getUserPreferencesUseCase(
      MockRequestContext,
      MockUserPreferencesRepo
    );
    const result = await usecase();

    expect(MockRequestContext.get).toHaveBeenCalledTimes(1);
    expect(MockUserPreferencesRepo.findById).toHaveBeenCalledWith(mockUser.id, {
      correlationId,
    });
    expect(result).toEqual(mockPreferences);
  });

  it('should throw ErrorUnauthorized if user is not in request context', async () => {
    MockRequestContext.get.mockReturnValue({} as IRequestContextData);

    const usecase = getUserPreferencesUseCase(
      MockRequestContext,
      MockUserPreferencesRepo
    );

    await expect(usecase()).rejects.toThrow(ErrorUnauthorized);
    expect(MockRequestContext.get).toHaveBeenCalledTimes(1);
    expect(MockUserPreferencesRepo.findById).not.toHaveBeenCalled();
  });
});
