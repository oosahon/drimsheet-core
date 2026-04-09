import { AppError } from '../../../../shared/value-objects/error';
import userPreferencesEntity from '../user-preferences.entity';
import { IUserPreferences } from '../../types/user-preferences.types';
import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import userEvents from '../../events/user.events';

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
        appPreferences: { theme: 'light' },
      };

      const [result, events] = userPreferencesEntity.make(validUserId, payload);

      expect(result.id).toBe(validUserId);
      expect(result.appPreferences.theme).toBe('light');
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
        appPreferences: { theme: 'dark' },
      };

      const [result, events] = userPreferencesEntity.make(validUserId, payload);

      expect(result.appPreferences.theme).toBe('dark');
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(userEvents.preferencesUpdated(result));
    });

    it('should create a valid user preferences entity with system theme successfully', () => {
      const validUserId = generateUUID();
      const payload: TCreationOmits<IUserPreferences> = {
        appPreferences: { theme: 'system' },
      };

      const [result, events] = userPreferencesEntity.make(validUserId, payload);

      expect(result.appPreferences.theme).toBe('system');
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(userEvents.preferencesUpdated(result));
    });

    it('should throw an error for invalid theme preference', () => {
      const validUserId = generateUUID();
      const payload: TCreationOmits<IUserPreferences> = {
        appPreferences: { theme: 'invalid-theme' as 'light' },
      };

      expect(() => userPreferencesEntity.make(validUserId, payload)).toThrow(
        AppError
      );
    });

    it('should throw an error for invalid userId format', () => {
      const payload: TCreationOmits<IUserPreferences> = {
        appPreferences: { theme: 'light' },
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
        appPreferences: { theme: 'light' },
      };

      const [initialEntity] = userPreferencesEntity.make(
        validUserId,
        initialPayload
      );

      // Move time forward slightly to test updatedAt
      jest.setSystemTime(new Date('2026-03-14T00:00:00.000Z'));

      const updatePayload: Partial<IUserPreferences> = {
        appPreferences: { theme: 'dark' },
      };

      const [updatedEntity, events] = userPreferencesEntity.update(
        initialEntity,
        updatePayload
      );

      expect(updatedEntity.id).toBe(initialEntity.id);
      expect(updatedEntity.appPreferences.theme).toBe('dark');
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
        appPreferences: { theme: 'system' },
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
        appPreferences: { theme: 'light' },
      };

      const [initialEntity] = userPreferencesEntity.make(
        validUserId,
        initialPayload
      );

      const updatePayload: Partial<IUserPreferences> = {
        appPreferences: { theme: 'invalid-theme' as 'light' },
      };

      expect(() =>
        userPreferencesEntity.update(initialEntity, updatePayload)
      ).toThrow(AppError);
    });
  });
});
