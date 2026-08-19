import { TEntityId } from '@shared/types/uuid';

import { mockUserPreferencesRepo } from '@app/user/contracts/__mocks__/user.repos.mock';
import { EAppUsageModePreference } from '@app/user/contracts/user-preferences.types';
import makeUserPreferencesService from '@app/user/services/user-preferences.service';

describe('makeUserPreferencesService', () => {
  const service = makeUserPreferencesService({
    userPreferencesRepo: mockUserPreferencesRepo,
  });
  const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
  const options = { correlationId: 'test-correlation-id' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('create', () => {
    it('builds and creates the user preferences record', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-08-19T12:00:00.000Z'));
      const accountingEntityId =
        '123e4567-e89b-12d3-a456-426614174001' as TEntityId;

      await service.create(
        {
          userId,
          lastActiveAccountingEntityId: accountingEntityId,
          appPreferences: {
            appUsageMode: EAppUsageModePreference.NonPowerUser,
          },
        },
        options
      );

      expect(mockUserPreferencesRepo.create).toHaveBeenCalledWith(
        {
          userId,
          lastActiveAccountingEntityId: accountingEntityId,
          appPreferences: {
            appUsageMode: EAppUsageModePreference.NonPowerUser,
          },
          createdAt: new Date('2026-08-19T12:00:00.000Z'),
          updatedAt: new Date('2026-08-19T12:00:00.000Z'),
        },
        options
      );
    });
  });

  describe('setLastActiveAccountingEntity', () => {
    it('builds and updates the user preferences record', async () => {
      const accountingEntityId =
        '123e4567-e89b-12d3-a456-426614174001' as TEntityId;

      await service.setLastActiveAccountingEntity(
        userId,
        accountingEntityId,
        options
      );

      expect(mockUserPreferencesRepo.update).toHaveBeenCalledWith(
        { userId, lastActiveAccountingEntityId: accountingEntityId },
        options
      );
    });

    it('propagates repository failures', async () => {
      mockUserPreferencesRepo.update.mockRejectedValueOnce(
        new Error('persistence failed')
      );

      await expect(
        service.setLastActiveAccountingEntity(userId, null, options)
      ).rejects.toThrow('persistence failed');
    });
  });
});
