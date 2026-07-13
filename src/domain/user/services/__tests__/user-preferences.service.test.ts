import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import { EUserEvents } from '../../events/user.events';
import mockUserPreferencesRepo from '../../repos/__mocks__/user-preferences.repo.impl.mock';
import {
  EAppThemePreference,
  EAppUsageModePreference,
  IUserPreferences,
} from '../../types/user-preferences.types';
import makeUserPreferencesService from '../user-preferences.service';

describe('makeUserPreferencesService', () => {
  const service = makeUserPreferencesService({
    userPreferencesRepo: mockUserPreferencesRepo,
  });
  const userId = generateUUID();
  const mockOptions: IReadRepoOptions = {
    correlationId: 'test-correlation-id',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('update', () => {
    it('should create new preferences if none exist using provided payload', async () => {
      mockUserPreferencesRepo.findById.mockResolvedValueOnce(null);

      const payload = {
        appPreferences: {
          theme: EAppThemePreference.Dark,
          appUsageMode: EAppUsageModePreference.PowerUser,
        },
      };

      const result = await service.update(userId, payload, mockOptions);

      expect(mockUserPreferencesRepo.findById).toHaveBeenCalledWith(
        userId,
        mockOptions
      );
      expect(result[0].id).toBe(userId);
      expect(result[0].appPreferences).toEqual({
        theme: EAppThemePreference.Dark,
        appUsageMode: EAppUsageModePreference.PowerUser,
      });
      expect(result[1]).toHaveLength(1);
      expect(result[1][0].type).toBe(EUserEvents.PreferencesUpdated);
    });

    it('should use null for theme and appUsageMode if not provided in payload and existing is null', async () => {
      mockUserPreferencesRepo.findById.mockResolvedValueOnce(null);

      const result = await service.update(userId, {}, mockOptions);

      expect(result[0].appPreferences).toEqual({
        theme: null,
        appUsageMode: null,
      });
    });

    it('should merge payload with existing preferences', async () => {
      const existingPreferences: IUserPreferences = {
        id: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        appPreferences: {
          theme: EAppThemePreference.Light,
          appUsageMode: EAppUsageModePreference.PowerUser,
        },
      };

      mockUserPreferencesRepo.findById.mockResolvedValueOnce(
        existingPreferences
      );

      const payload = {
        appPreferences: {
          theme: EAppThemePreference.Dark,
        },
      };

      const result = await service.update(userId, payload, mockOptions);

      expect(result[0].appPreferences).toEqual({
        theme: EAppThemePreference.Dark,
        appUsageMode: EAppUsageModePreference.PowerUser,
      });
    });

    it('should keep existing preferences if payload appPreferences is completely empty', async () => {
      const existingPreferences: IUserPreferences = {
        id: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        appPreferences: {
          theme: EAppThemePreference.System,
          appUsageMode: EAppUsageModePreference.NonPowerUser,
        },
      };

      mockUserPreferencesRepo.findById.mockResolvedValueOnce(
        existingPreferences
      );

      const result = await service.update(
        userId,
        { appPreferences: {} },
        mockOptions
      );

      expect(result[0].appPreferences).toEqual({
        theme: EAppThemePreference.System,
        appUsageMode: EAppUsageModePreference.NonPowerUser,
      });
    });
  });
});
