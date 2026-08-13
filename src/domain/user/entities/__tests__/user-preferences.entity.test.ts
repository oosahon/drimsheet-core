import { TCreationOmits } from '@shared/types/creation-omits.types';
import { TEntityId } from '@shared/types/uuid';
import generateUUID from '@shared/utils/uuid-generator';

import userPreferencesEntity from '@domain/user/entities/user-preferences.entity';
import userEvents from '@domain/user/events/user.events';
import { IUserPreferences } from '@domain/user/types/user-preferences.types';

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
      const accountingEntityId = generateUUID();
      const payload: TCreationOmits<IUserPreferences> = {
        appPreferences: { theme: 'light', appUsageMode: 'power_user' },
        lastActiveAccountingEntityId: accountingEntityId,
      };

      const [result, events] = userPreferencesEntity.make(validUserId, payload);

      expect(result.id).toBe(validUserId);
      expect(result.appPreferences.theme).toBe('light');
      expect(result.appPreferences.appUsageMode).toBe('power_user');
      expect(result.lastActiveAccountingEntityId).toBe(accountingEntityId);
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
        lastActiveAccountingEntityId: null,
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
        lastActiveAccountingEntityId: null,
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
        lastActiveAccountingEntityId: null,
      };

      expect(() => userPreferencesEntity.make(validUserId, payload)).toThrow();
    });

    it('should throw an error for invalid usage mode preference', () => {
      const validUserId = generateUUID();
      const payload: TCreationOmits<IUserPreferences> = {
        appPreferences: {
          theme: 'light',
          appUsageMode: 'invalid-mode' as 'power_user',
        },
        lastActiveAccountingEntityId: null,
      };

      expect(() => userPreferencesEntity.make(validUserId, payload)).toThrow();
    });

    it('should throw an error for invalid userId format', () => {
      const payload: TCreationOmits<IUserPreferences> = {
        appPreferences: { theme: 'light', appUsageMode: 'power_user' },
        lastActiveAccountingEntityId: null,
      };

      expect(() =>
        userPreferencesEntity.make('invalid-id' as any, payload)
      ).toThrow();
    });

    it('should create user preferences entity successfully when appPreferences is undefined', () => {
      const validUserId = generateUUID();
      const payload = {
        lastActiveAccountingEntityId: null,
      } as unknown as TCreationOmits<IUserPreferences>;

      const [result] = userPreferencesEntity.make(validUserId, payload);

      expect(result.id).toBe(validUserId);
      expect(result.appPreferences.theme).toBeUndefined();
      expect(result.appPreferences.appUsageMode).toBeUndefined();
    });

    it('should create user preferences entity successfully when appPreferences is null', () => {
      const validUserId = generateUUID();
      const payload = {
        appPreferences: null as any,
        lastActiveAccountingEntityId: null,
      } as unknown as TCreationOmits<IUserPreferences>;

      const [result] = userPreferencesEntity.make(validUserId, payload);

      expect(result.id).toBe(validUserId);
      expect(result.appPreferences.theme).toBeUndefined();
      expect(result.appPreferences.appUsageMode).toBeUndefined();
    });

    it('should reject an invalid last active accounting entity ID', () => {
      const payload: TCreationOmits<IUserPreferences> = {
        appPreferences: {},
        lastActiveAccountingEntityId: 'invalid-id' as TEntityId,
      };

      expect(() =>
        userPreferencesEntity.make(generateUUID(), payload)
      ).toThrow();
    });
  });

  describe('update', () => {
    it('should update user preferences theme successfully', () => {
      const validUserId = generateUUID();
      const initialPayload: TCreationOmits<IUserPreferences> = {
        appPreferences: { theme: 'light', appUsageMode: 'power_user' },
        lastActiveAccountingEntityId: null,
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
        lastActiveAccountingEntityId: null,
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
        lastActiveAccountingEntityId: null,
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
      ).toThrow();
    });

    it('should throw an error for invalid usage mode preference when updating', () => {
      const validUserId = generateUUID();
      const initialPayload: TCreationOmits<IUserPreferences> = {
        appPreferences: { theme: 'light', appUsageMode: 'power_user' },
        lastActiveAccountingEntityId: null,
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
      ).toThrow();
    });

    it('should update and clear the last active accounting entity ID', () => {
      const accountingEntityId = generateUUID();
      const [initialEntity] = userPreferencesEntity.make(generateUUID(), {
        appPreferences: {},
        lastActiveAccountingEntityId: null,
      });

      const [selectedEntity, selectionEvents] = userPreferencesEntity.update(
        initialEntity,
        { lastActiveAccountingEntityId: accountingEntityId }
      );
      const [clearedEntity, clearEvents] = userPreferencesEntity.update(
        selectedEntity,
        { lastActiveAccountingEntityId: null }
      );

      expect(selectedEntity.lastActiveAccountingEntityId).toBe(
        accountingEntityId
      );
      expect(selectionEvents[0].data).toBe(selectedEntity);
      expect(clearedEntity.lastActiveAccountingEntityId).toBeNull();
      expect(clearEvents[0].data).toBe(clearedEntity);
    });

    it('should preserve the last active accounting entity ID when omitted', () => {
      const accountingEntityId = generateUUID();
      const [initialEntity] = userPreferencesEntity.make(generateUUID(), {
        appPreferences: {},
        lastActiveAccountingEntityId: accountingEntityId,
      });

      const [updatedEntity] = userPreferencesEntity.update(initialEntity, {});

      expect(updatedEntity.lastActiveAccountingEntityId).toBe(
        accountingEntityId
      );
    });

    it('should reject an invalid last active accounting entity ID', () => {
      const [initialEntity] = userPreferencesEntity.make(generateUUID(), {
        appPreferences: {},
        lastActiveAccountingEntityId: null,
      });

      expect(() =>
        userPreferencesEntity.update(initialEntity, {
          lastActiveAccountingEntityId: 'invalid-id' as TEntityId,
        })
      ).toThrow();
    });
  });

  describe('rehydrate', () => {
    it('should rehydrate user preferences successfully', () => {
      const validUserId = generateUUID();
      const payload: IUserPreferences = {
        id: validUserId,
        appPreferences: { theme: 'light', appUsageMode: 'power_user' },
        lastActiveAccountingEntityId: generateUUID(),
        createdAt: new Date('2026-03-13T00:00:00.000Z'),
        updatedAt: new Date('2026-03-13T00:00:00.000Z'),
      };

      const result = userPreferencesEntity.rehydrate(payload);

      expect(result.id).toBe(validUserId);
      expect(result.appPreferences.theme).toBe('light');
      expect(result.appPreferences.appUsageMode).toBe('power_user');
      expect(result.lastActiveAccountingEntityId).toBe(
        payload.lastActiveAccountingEntityId
      );
      expect(result.createdAt).toEqual(payload.createdAt);
      expect(result.updatedAt).toEqual(payload.updatedAt);
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.appPreferences)).toBe(true);
    });

    it('should throw an error for invalid userId format during rehydration', () => {
      const payload: IUserPreferences = {
        id: 'invalid-id' as any,
        appPreferences: { theme: 'light', appUsageMode: 'power_user' },
        lastActiveAccountingEntityId: null,
        createdAt: new Date('2026-03-13T00:00:00.000Z'),
        updatedAt: new Date('2026-03-13T00:00:00.000Z'),
      };

      expect(() => userPreferencesEntity.rehydrate(payload)).toThrow();
    });

    it('should reject an invalid rehydrated accounting entity ID', () => {
      const payload: IUserPreferences = {
        id: generateUUID(),
        appPreferences: {},
        lastActiveAccountingEntityId: 'invalid-id' as TEntityId,
        createdAt: new Date('2026-03-13T00:00:00.000Z'),
        updatedAt: new Date('2026-03-13T00:00:00.000Z'),
      };

      expect(() => userPreferencesEntity.rehydrate(payload)).toThrow();
    });
  });
});
