import { TEntityId } from '@shared/types/uuid';

import userEntityHelpers from '@domain/user/entities/helpers/user.entity.helpers';
import userError from '@domain/user/errors/user.error';
import { IUser } from '@domain/user/types/user.types';

describe('userEntityHelpers', () => {
  describe('validate', () => {
    const validUser: IUser = {
      id: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      emailVerified: true,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('does not throw for a valid user', () => {
      expect(() => userEntityHelpers.validate(validUser)).not.toThrow();
    });

    it('throws InvalidAction when user is deleted', () => {
      const deletedUser = {
        ...validUser,
        deletedAt: new Date(),
      };
      expect(() => userEntityHelpers.validate(deletedUser)).toThrow(
        userError.InvalidAction
      );
    });

    it('throws InvalidValue when user ID is invalid UUID', () => {
      const invalidIdUser = {
        ...validUser,
        id: 'invalid-uuid' as TEntityId,
      };
      expect(() => userEntityHelpers.validate(invalidIdUser)).toThrow(
        userError.InvalidValue
      );
    });

    it('throws InvalidValue when firstName is invalid', () => {
      const invalidFirstNameUser = {
        ...validUser,
        firstName: '',
      };
      expect(() => userEntityHelpers.validate(invalidFirstNameUser)).toThrow(
        userError.InvalidValue
      );
    });

    it('throws InvalidValue when lastName is invalid', () => {
      const invalidLastNameUser = {
        ...validUser,
        lastName: '',
      };
      expect(() => userEntityHelpers.validate(invalidLastNameUser)).toThrow(
        userError.InvalidValue
      );
    });

    it('throws when email is invalid', () => {
      const invalidEmailUser = {
        ...validUser,
        email: 'invalid-email',
      };
      expect(() => userEntityHelpers.validate(invalidEmailUser)).toThrow();
    });
  });
});
