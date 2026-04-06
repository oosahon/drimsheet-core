import { AppError } from '../../../../shared/value-objects/error';
import userEntity from '../user.entity';
import { IUser } from '../../types/user.types';
import { TCreationOmits } from '../../../../shared/types/creation-omits.types';

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
      expect(events[0].event.type).toBe('domain:user:created');
      expect(events[0].event.data).toEqual(result);

      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
      expect(result.email).toBe('test@example.com');
      expect(result.emailVerified).toBe(false);
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
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
      expect(events[0].event.data).toEqual(result);
    });

    it('should throw an error for invalid firstName length', () => {
      const payload: TCreationOmits<IUser> = {
        email: 'test@example.com',
        firstName: '',
        lastName: 'Doe',
        emailVerified: false,
      };

      expect(() => userEntity.make(payload)).toThrow(AppError);

      const longName = 'A'.repeat(101);
      expect(() =>
        userEntity.make({ ...payload, firstName: longName })
      ).toThrow(AppError);
    });

    it('should throw an error for invalid lastName length', () => {
      const payload: TCreationOmits<IUser> = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: '',
        emailVerified: false,
      };

      expect(() => userEntity.make(payload)).toThrow(AppError);

      const longName = 'A'.repeat(101);
      expect(() => userEntity.make({ ...payload, lastName: longName })).toThrow(
        AppError
      );
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
      const [result, events] = userEntity.verifyEmail(unverifiedUser);

      expect(events).toHaveLength(1);
      expect(events[0].event.type).toBe('domain:user:email-verified');
      expect(events[0].event.data).toEqual(result);

      expect(result.emailVerified).toBe(true);
      expect(result.updatedAt.getTime()).toBeGreaterThan(
        unverifiedUser.updatedAt.getTime()
      );
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('should return identical user and no events if email is already verified', () => {
      const [result, events] = userEntity.verifyEmail(verifiedUser);

      expect(events).toHaveLength(0);
      expect(result).toBe(verifiedUser);
    });

    it('should throw error if user is invalid before verifying', () => {
      const invalidUser = { ...unverifiedUser, firstName: '' };
      expect(() => userEntity.verifyEmail(invalidUser)).toThrow(AppError);
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
      const [result, events] = userEntity.update(
        existingUser,
        updateOptions
      ) as [IUser, any[]];

      expect(events).toHaveLength(1);
      expect(events[0].event.type).toBe('domain:user:updated');
      expect(events[0].event.data).toEqual(result);

      expect(result.firstName).toBe('Updated First');
      expect(result.lastName).toBe('Updated Last');
      expect(result.updatedAt.getTime()).toBeGreaterThan(
        existingUser.updatedAt.getTime()
      );
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('should update only firstName correctly', () => {
      const updateOptions = { firstName: 'Updated First' };
      const [result, events] = userEntity.update(
        existingUser,
        updateOptions
      ) as [IUser, any[]];

      expect(events).toHaveLength(1);
      expect(result.firstName).toBe('Updated First');
      expect(result.lastName).toBe('Original Last');
    });

    it('should update only lastName correctly', () => {
      const updateOptions = { lastName: 'Updated Last' };
      const [result, events] = userEntity.update(
        existingUser,
        updateOptions
      ) as [IUser, any[]];

      expect(events).toHaveLength(1);
      expect(result.firstName).toBe('Original First');
      expect(result.lastName).toBe('Updated Last');
    });

    it('should return identical user and no events if unchanged', () => {
      const updateOptions = {
        firstName: 'Original First',
        lastName: 'Original Last',
      };
      const [result, events] = userEntity.update(
        existingUser,
        updateOptions
      ) as [IUser, any[]];

      expect(events).toHaveLength(0);
      expect(result).toBe(existingUser);
    });

    it('should throw error if user is invalid before updating', () => {
      const invalidNameUser = { ...existingUser, firstName: '' };
      expect(() =>
        userEntity.update(invalidNameUser, { firstName: 'Changed' })
      ).toThrow(AppError);
    });
  });
});
