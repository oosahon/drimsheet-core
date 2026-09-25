import { TEntityId } from '@shared/types/uuid';

import userEntity from '@domain/user/entities/user.entity';
import userValidation from '@domain/user/entities/validations/user.validation';
import userError from '@domain/user/errors/user.error';
import { IUser } from '@domain/user/types/user.types';

describe('userValidation', () => {
  it('is frozen', () => {
    expect(Object.isFrozen(userValidation)).toBe(true);
    expect(userEntity.validate).toBe(userValidation.validate);
  });

  describe('validate', () => {
    const validUser: IUser = {
      createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
      actorId: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
      id: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
      version: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      emailVerified: true,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('does not throw for a valid user', () => {
      expect(() => userValidation.validate(validUser)).not.toThrow();
    });

    it('throws InvalidAction when user is deleted', () => {
      const deletedUser = {
        ...validUser,
        deletedAt: new Date(),
      };
      expect(() => userValidation.validate(deletedUser)).toThrow(
        userError.InvalidAction
      );
    });

    it('throws InvalidId when user ID is invalid UUID', () => {
      const invalidIdUser = {
        ...validUser,
        id: 'invalid-uuid' as TEntityId,
      };
      expect(() => userValidation.validate(invalidIdUser)).toThrow(
        userError.InvalidId
      );
    });

    it('throws InvalidFirstName when firstName is invalid', () => {
      const invalidFirstNameUser = {
        ...validUser,
        firstName: '',
      };
      expect(() => userValidation.validate(invalidFirstNameUser)).toThrow(
        userError.InvalidFirstName
      );
    });

    it('throws InvalidLastName when lastName is invalid', () => {
      const invalidLastNameUser = {
        ...validUser,
        lastName: '',
      };
      expect(() => userValidation.validate(invalidLastNameUser)).toThrow(
        userError.InvalidLastName
      );
    });

    it('throws when email is invalid', () => {
      const invalidEmailUser = {
        ...validUser,
        email: 'invalid-email',
      };
      expect(() => userValidation.validate(invalidEmailUser)).toThrow();
    });
  });
});
