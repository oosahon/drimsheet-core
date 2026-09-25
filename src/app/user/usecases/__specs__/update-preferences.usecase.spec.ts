import { TEntityId } from '@shared/types/uuid';

import { IUser } from '@domain/user/types/user.types';

import mockAppContext from '@app/context/contracts/__mocks__/app-context.mock';
import mockUserPreferencesService from '@app/user/contracts/__mocks__/user-preferences.service.mock';
import {
  EAppThemePreference,
  EAppUsageModePreference,
  IUserPreferences,
} from '@app/user/types/user-preferences.types';
import makeUpdateUserPreferencesUsecase from '@app/user/usecases/update-preferences.usecase';

describe('makeUpdateUserPreferencesUsecase', () => {
  const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
  const correlationId = 'test-correlation-id';
  const usecase = makeUpdateUserPreferencesUsecase({
    appContext: mockAppContext,
    userPreferencesService: mockUserPreferencesService,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppContext.get.mockReturnValue({
      user: {
        createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
        actorId: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
        id: userId,
      } as IUser,
      correlationId,
    } as ReturnType<typeof mockAppContext.get>);
  });

  it('validates before accessing request context', async () => {
    await expect(usecase({})).rejects.toThrow('app_error_validation_error');

    expect(mockAppContext.get).not.toHaveBeenCalled();
    expect(mockUserPreferencesService.update).not.toHaveBeenCalled();
  });

  it('updates the authenticated user and returns full user preferences', async () => {
    const appPreferences = {
      theme: EAppThemePreference.Dark,
      appUsageMode: EAppUsageModePreference.NonPowerUser,
    };
    const updatedPreferences: IUserPreferences = {
      createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
      userId,
      lastActiveAccountingEntityId: null,
      appPreferences,
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
      updatedAt: new Date('2026-08-19T00:00:00.000Z'),
    };
    mockUserPreferencesService.update.mockResolvedValue(updatedPreferences);

    await expect(usecase(appPreferences)).resolves.toEqual(updatedPreferences);

    expect(mockUserPreferencesService.update).toHaveBeenCalledWith(
      {
        createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
        userId,
        appPreferences,
      },
      { correlationId }
    );
  });

  it('propagates preference service failures', async () => {
    mockUserPreferencesService.update.mockRejectedValue(
      new Error('persistence failed')
    );

    await expect(
      usecase({ theme: EAppThemePreference.System })
    ).rejects.toThrow('persistence failed');
  });
});
