import { AppError } from '../../../../shared/errors/error';
import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import { IUserActivity } from '../../types/user-activity.types';
import userActivityEntity from '../user-activity.entity';

describe('User Activity Entity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-13T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('make', () => {
    it('should create a valid user activity successfully without meta', () => {
      const validUserId = generateUUID();
      const payload: TCreationOmits<IUserActivity> = {
        userId: validUserId,
        eventKey: 'domain.auth.login',
        description: 'User logged in',
        meta: null,
      };

      const result = userActivityEntity.make(payload);

      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
      expect(result.userId).toBe(validUserId);
      expect(result.eventKey).toBe('domain.auth.login');
      expect(result.description).toBe('User logged in');
      expect(result.meta).toBeNull();
      expect(result.createdAt).toEqual(new Date('2026-03-13T00:00:00.000Z'));
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('should create a valid user activity successfully with meta', () => {
      const validUserId = generateUUID();
      const meta = { correlationId: generateUUID(), ip: '127.0.0.1' };
      const payload: TCreationOmits<IUserActivity> = {
        userId: validUserId,
        eventKey: 'domain.user.updated',
        description: 'User profile updated',
        meta,
      };

      const result = userActivityEntity.make(payload);

      expect(result.meta).toEqual(meta);
    });

    it('should throw an error for invalid userId format', () => {
      const payload: TCreationOmits<IUserActivity> = {
        userId: 'invalid-id' as unknown as IUserActivity['userId'],
        eventKey: 'domain.auth.login',
        description: 'User logged in',
        meta: null,
      };

      expect(() => userActivityEntity.make(payload)).toThrow(AppError);
    });

    it('should throw an error for missing or empty eventKey', () => {
      const validUserId = generateUUID();
      const payload: TCreationOmits<IUserActivity> = {
        userId: validUserId,
        eventKey: '',
        description: 'User logged in',
        meta: null,
      };

      expect(() => userActivityEntity.make(payload)).toThrow(AppError);
    });

    it('should throw an error for eventKey length exceeding max limit', () => {
      const validUserId = generateUUID();
      const longKey = 'A'.repeat(101);
      const payload: TCreationOmits<IUserActivity> = {
        userId: validUserId,
        eventKey: longKey,
        description: 'User logged in',
        meta: null,
      };

      expect(() => userActivityEntity.make(payload)).toThrow(AppError);
    });

    it('should throw an error for missing or empty description', () => {
      const validUserId = generateUUID();
      const payload: TCreationOmits<IUserActivity> = {
        userId: validUserId,
        eventKey: 'domain.auth.login',
        description: '',
        meta: null,
      };

      expect(() => userActivityEntity.make(payload)).toThrow(AppError);
    });

    it('should throw an error for description length exceeding max limit', () => {
      const validUserId = generateUUID();
      const longDescription = 'A'.repeat(101);
      const payload: TCreationOmits<IUserActivity> = {
        userId: validUserId,
        eventKey: 'domain.auth.login',
        description: longDescription,
        meta: null,
      };

      expect(() => userActivityEntity.make(payload)).toThrow(AppError);
    });

    it('should throw an error if meta is provided but is not an object', () => {
      const validUserId = generateUUID();
      const payload: TCreationOmits<IUserActivity> = {
        userId: validUserId,
        eventKey: 'domain.auth.login',
        description: 'User logged in',
        meta: 'invalid-meta' as unknown as IUserActivity['meta'],
      };

      expect(() => userActivityEntity.make(payload)).toThrow(AppError);
    });
  });
});
