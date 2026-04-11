import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import { AppError } from '../../../../shared/value-objects/error';
import userEvents from '../../events/user.events';
import { IUserPreferences } from '../../types/user-preferences.types';
import userPreferencesEntity from '../user-preferences.entity';

describe('User Preferences Entity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-13T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('make', () => {
    it('should create a valid user preferences entity with light theme successfully', () => {
      const validUserId = generateUUID();
      const payload: TCreationOmits<IUserPreferences> = {
        appPreferences: { theme: 'light', appUsageMode: 'power_user' },
      };

      const [result, events] = userPreferencesEntity.make(validUserId, payload);

      expect(result.id).toBe(validUserId);
      expect(result.appPreferences.theme).toBe('light');
      expect(result.appPreferences.appUsageMode).toBe('power_user');
      expect(result.createdAt).toEqual(new Date('2026-03-13T00:00:00.000Z'));
      expect(result.updatedAt).toEqual(new Date('2026-03-13T00:00:00.000Z'));
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.appPreferences)).toBe(true);

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(userEvents.preferencesUpdated(result));
    });

    it('should create a valid user preferences entity with dark theme successfully', () => {
      const validUserId = generateUUID();
      const payload: TCreationOmits<IUserPreferences> = {
        appPreferences: { theme: 'dark', appUsageMode: 'non_power_user' },
      };

      const [result, events] = userPreferencesEntity.make(validUserId, payload);

      expect(result.appPreferences.theme).toBe('dark');
      expect(result.appPreferences.appUsageMode).toBe('non_power_user');
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(userEvents.preferencesUpdated(result));
    });

    it('should create a valid user preferences entity with system theme successfully', () => {
      const validUserId = generateUUID();
      const payload: TCreationOmits<IUserPreferences> = {
        appPreferences: { theme: 'system', appUsageMode: 'power_user' },
      };

      const [result, events] = userPreferencesEntity.make(validUserId, payload);

      expect(result.appPreferences.theme).toBe('system');
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(userEvents.preferencesUpdated(result));
    });

    it('should throw an error for invalid theme preference', () => {
      const validUserId = generateUUID();
      const payload: TCreationOmits<IUserPreferences> = {
        appPreferences: {
          theme: 'invalid-theme' as 'light',
          appUsageMode: 'power_user',
        },
      };

      expect(() => userPreferencesEntity.make(validUserId, payload)).toThrow(
        AppError
      );
    });

    it('should throw an error for invalid usage mode preference', () => {
      const validUserId = generateUUID();
      const payload: TCreationOmits<IUserPreferences> = {
        appPreferences: {
          theme: 'light',
          appUsageMode: 'invalid-mode' as 'power_user',
        },
      };

      expect(() => userPreferencesEntity.make(validUserId, payload)).toThrow(
        AppError
      );
    });

    it('should throw an error for invalid userId format', () => {
      const payload: TCreationOmits<IUserPreferences> = {
        appPreferences: { theme: 'light', appUsageMode: 'power_user' },
      };

      expect(() =>
        userPreferencesEntity.make('invalid-id' as any, payload)
      ).toThrow(AppError);
    });
  });

  describe('update', () => {
    it('should update user preferences theme successfully', () => {
      const validUserId = generateUUID();
      const initialPayload: TCreationOmits<IUserPreferences> = {
        appPreferences: { theme: 'light', appUsageMode: 'power_user' },
      };

      const [initialEntity] = userPreferencesEntity.make(
        validUserId,
        initialPayload
      );

      // Move time forward slightly to test updatedAt
      jest.setSystemTime(new Date('2026-03-14T00:00:00.000Z'));

      const updatePayload: Partial<IUserPreferences> = {
        appPreferences: { theme: 'dark', appUsageMode: 'non_power_user' },
      };

      const [updatedEntity, events] = userPreferencesEntity.update(
        initialEntity,
        updatePayload
      );

      expect(updatedEntity.id).toBe(initialEntity.id);
      expect(updatedEntity.appPreferences.theme).toBe('dark');
      expect(updatedEntity.appPreferences.appUsageMode).toBe('non_power_user');
      expect(updatedEntity.createdAt).toEqual(initialEntity.createdAt);
      expect(updatedEntity.updatedAt).toEqual(
        new Date('2026-03-14T00:00:00.000Z')
      );
      expect(Object.isFrozen(updatedEntity)).toBe(true);
      expect(Object.isFrozen(updatedEntity.appPreferences)).toBe(true);

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(userEvents.preferencesUpdated(updatedEntity));
    });

    it('should retain existing preferences if payload does not contain appPreferences', () => {
      const validUserId = generateUUID();
      const initialPayload: TCreationOmits<IUserPreferences> = {
        appPreferences: { theme: 'system', appUsageMode: 'power_user' },
      };

      const [initialEntity] = userPreferencesEntity.make(
        validUserId,
        initialPayload
      );

      jest.setSystemTime(new Date('2026-03-14T00:00:00.000Z'));

      const updatePayload: Partial<IUserPreferences> = {};

      const [updatedEntity, events] = userPreferencesEntity.update(
        initialEntity,
        updatePayload
      );

      expect(updatedEntity.id).toBe(initialEntity.id);
      expect(updatedEntity.appPreferences.theme).toBe('system');
      expect(updatedEntity.appPreferences.appUsageMode).toBe('power_user');
      expect(updatedEntity.createdAt).toEqual(initialEntity.createdAt);
      expect(updatedEntity.updatedAt).toEqual(
        new Date('2026-03-14T00:00:00.000Z')
      );

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(userEvents.preferencesUpdated(updatedEntity));
    });

    it('should throw an error for invalid theme preference when updating', () => {
      const validUserId = generateUUID();
      const initialPayload: TCreationOmits<IUserPreferences> = {
        appPreferences: { theme: 'light', appUsageMode: 'power_user' },
      };

      const [initialEntity] = userPreferencesEntity.make(
        validUserId,
        initialPayload
      );

      const updatePayload: Partial<IUserPreferences> = {
        appPreferences: {
          theme: 'invalid-theme' as 'light',
          appUsageMode: 'power_user',
        },
      };

      expect(() =>
        userPreferencesEntity.update(initialEntity, updatePayload)
      ).toThrow(AppError);
    });

    it('should throw an error for invalid usage mode preference when updating', () => {
      const validUserId = generateUUID();
      const initialPayload: TCreationOmits<IUserPreferences> = {
        appPreferences: { theme: 'light', appUsageMode: 'power_user' },
      };

      const [initialEntity] = userPreferencesEntity.make(
        validUserId,
        initialPayload
      );

      const updatePayload: Partial<IUserPreferences> = {
        appPreferences: {
          theme: 'light',
          appUsageMode: 'invalid-mode' as 'power_user',
        },
      };

      expect(() =>
        userPreferencesEntity.update(initialEntity, updatePayload)
      ).toThrow(AppError);
    });
  });
});
