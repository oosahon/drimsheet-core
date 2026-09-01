import { TCreationOmits } from '@shared/types/creation-omits.types';

import userEntity from '@domain/user/entities/user.entity';
import { EUserEntityActions } from '@domain/user/types/user-audit.types';
import { IUser } from '@domain/user/types/user.types';

describe('User Entity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-13T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('make', () => {
    it('should create a valid user successfully', () => {
      const payload: TCreationOmits<IUser> = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: false,
      };

      const [result, events] = userEntity.make(payload);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('domain:user:created');
      expect(events[0].data).toEqual(result);

      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
      expect(result.email).toBe('test@example.com');
      expect(result.emailVerified).toBe(false);
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.version).toBe(1);
      expect(result.createdAt).toEqual(new Date('2026-03-13T00:00:00.000Z'));
      expect(result.updatedAt).toEqual(new Date('2026-03-13T00:00:00.000Z'));
      expect(result.deletedAt).toBeNull();
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('should create a valid user with verified email if provided', () => {
      const payload: TCreationOmits<IUser> = {
        email: 'verified@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        emailVerified: true,
      };

      const [result, events] = userEntity.make(payload);

      expect(result.emailVerified).toBe(true);
      expect(result.version).toBe(1);
      expect(events[0].data).toEqual(result);
    });

    it('should throw an error for invalid firstName length', () => {
      const payload: TCreationOmits<IUser> = {
        email: 'test@example.com',
        firstName: '',
        lastName: 'Doe',
        emailVerified: false,
      };

      expect(() => userEntity.make(payload)).toThrow();

      const longName = 'A'.repeat(101);
      expect(() =>
        userEntity.make({ ...payload, firstName: longName })
      ).toThrow();
    });

    it('should throw an error for invalid lastName length', () => {
      const payload: TCreationOmits<IUser> = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: '',
        emailVerified: false,
      };

      expect(() => userEntity.make(payload)).toThrow();

      const longName = 'A'.repeat(101);
      expect(() =>
        userEntity.make({ ...payload, lastName: longName })
      ).toThrow();
    });
  });

  describe('verifyEmail', () => {
    let unverifiedUser: IUser;
    let verifiedUser: IUser;

    beforeEach(() => {
      [unverifiedUser] = userEntity.make({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: false,
      });

      [verifiedUser] = userEntity.make({
        email: 'verified@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        emailVerified: true,
      });

      jest.advanceTimersByTime(1000);
    });

    it('should verify email and update updatedAt', () => {
      const [result, events, audit] = userEntity.verifyEmail(unverifiedUser);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('domain:user:email-verified');
      expect(events[0].data).toEqual(result);

      expect(result.emailVerified).toBe(true);
      expect(result.updatedAt.getTime()).toBeGreaterThan(
        unverifiedUser.updatedAt.getTime()
      );
      expect(Object.isFrozen(result)).toBe(true);

      expect(audit).not.toBeNull();
      expect(audit!.action).toBe(EUserEntityActions.EmailVerified);
      expect(audit!.entityId).toBe(unverifiedUser.id);
      expect(audit!.diff.before).not.toBeNull();
      expect(audit!.diff.after).toEqual(result);
    });

    it('should return identical user, no events, and null audit if email is already verified', () => {
      const [result, events, audit] = userEntity.verifyEmail(verifiedUser);

      expect(events).toHaveLength(0);
      expect(result).toBe(verifiedUser);
      expect(audit).toBeNull();
    });

    it('should throw error if user is invalid before verifying', () => {
      const invalidUser = { ...unverifiedUser, firstName: '' };
      expect(() => userEntity.verifyEmail(invalidUser)).toThrow();
    });
  });

  describe('update', () => {
    let existingUser: IUser;

    beforeEach(() => {
      [existingUser] = userEntity.make({
        email: 'test@example.com',
        firstName: 'Original First',
        lastName: 'Original Last',
        emailVerified: false,
      });

      jest.advanceTimersByTime(1000);
    });

    it('should update firstName and lastName correctly', () => {
      const updateOptions = {
        firstName: 'Updated First',
        lastName: 'Updated Last',
      };
      const [result, events, audit] = userEntity.update(
        existingUser,
        updateOptions
      );

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('domain:user:updated');
      expect(events[0].data).toEqual(result);

      expect(result.firstName).toBe('Updated First');
      expect(result.lastName).toBe('Updated Last');
      expect(result.version).toBe(existingUser.version + 1);
      expect(result.updatedAt.getTime()).toBeGreaterThan(
        existingUser.updatedAt.getTime()
      );
      expect(Object.isFrozen(result)).toBe(true);

      expect(audit).not.toBeNull();
      expect(audit!.action).toBe(EUserEntityActions.Updated);
      expect(audit!.entityId).toBe(existingUser.id);
      expect(audit!.diff.before).not.toBeNull();
      expect(audit!.diff.after).toEqual(result);
    });

    it('should update only firstName correctly', () => {
      const updateOptions = { firstName: 'Updated First' };
      const [result, events, audit] = userEntity.update(
        existingUser,
        updateOptions
      );

      expect(events).toHaveLength(1);
      expect(result.firstName).toBe('Updated First');
      expect(result.lastName).toBe('Original Last');
      expect(audit).not.toBeNull();
      expect(audit!.action).toBe(EUserEntityActions.Updated);
    });

    it('should update only lastName correctly', () => {
      const updateOptions = { lastName: 'Updated Last' };
      const [result, events, audit] = userEntity.update(
        existingUser,
        updateOptions
      );

      expect(events).toHaveLength(1);
      expect(result.firstName).toBe('Original First');
      expect(result.lastName).toBe('Updated Last');
      expect(audit).not.toBeNull();
      expect(audit!.action).toBe(EUserEntityActions.Updated);
    });

    it('should return identical user, no events, and null audit if unchanged', () => {
      const updateOptions = {
        firstName: 'Original First',
        lastName: 'Original Last',
      };
      const [result, events, audit] = userEntity.update(
        existingUser,
        updateOptions
      );

      expect(events).toHaveLength(0);
      expect(result).toBe(existingUser);
      expect(audit).toBeNull();
    });

    it('should throw error if user is invalid before updating', () => {
      const invalidNameUser = { ...existingUser, firstName: '' };
      expect(() =>
        userEntity.update(invalidNameUser, { firstName: 'Changed' })
      ).toThrow();
    });
  });
});
