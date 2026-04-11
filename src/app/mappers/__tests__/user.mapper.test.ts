import { IUser } from '../../../domain/user/types/user.types';
import { TEntityId } from '../../../shared/types/uuid';
import userMapper, { IUserModel } from '../user.mapper';

describe('User Mapper', () => {
  const createdAt = new Date('2026-04-10T12:00:00Z');
  const updatedAt = new Date('2026-04-10T12:30:00Z');
  const deletedAt = new Date('2026-04-10T13:00:00Z');

  const domainUser: IUser = {
    id: 'user-1' as TEntityId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    emailVerified: true,
    password: 'secure-password',
    createdAt,
    updatedAt,
    deletedAt,
  };

  const repoModel: Parameters<typeof userMapper.toDomain>[0] = {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    emailVerified: true,
    password: 'secure-password',
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    deletedAt: deletedAt.toISOString(),
  };

  describe('toRepo', () => {
    it('should map domain user to a repo model', () => {
      expect(userMapper.toRepo(domainUser)).toEqual({
        ...repoModel,
        password: 'secure-password', // explicit to match object
      });
    });

    it('should map domain user to a repo model with null password and deletedAt', () => {
      const { password, deletedAt, ...restDomain } = domainUser;

      const domainUserWithoutOptional = {
        ...restDomain,
        deletedAt: null,
      };

      const expectedRepoModel = {
        ...repoModel,
        password: null,
        deletedAt: null,
      };

      expect(userMapper.toRepo(domainUserWithoutOptional)).toEqual(
        expectedRepoModel
      );
    });
  });

  describe('toDomain', () => {
    it('should map a repo model to a domain user', () => {
      expect(userMapper.toDomain(repoModel as IUserModel)).toEqual(domainUser);
    });

    it('should map a repo model with null password and deletedAt to domain user', () => {
      const repoModelWithoutOptional = {
        ...repoModel,
        password: null,
        deletedAt: null,
      };

      const expectedDomainUser = {
        ...domainUser,
        password: undefined,
        deletedAt: null,
      };

      expect(
        userMapper.toDomain(repoModelWithoutOptional as IUserModel)
      ).toEqual(expectedDomainUser);
    });
  });

  describe('toInterface', () => {
    it('should map domain user to interface representation (remove password)', () => {
      const interfaceUser = userMapper.toInterface(domainUser);

      expect(interfaceUser).not.toHaveProperty('password');
      expect(interfaceUser.id).toBe(domainUser.id);
      expect(interfaceUser.firstName).toBe(domainUser.firstName);
    });
  });
});
