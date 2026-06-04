import { TEntityId } from '../../../../shared/types/uuid';
import {
  EAuthStrategy,
  IUserAuth,
} from '../../../shared/contracts/auth-service.contract';
import userAuthMapper, { IUserAuthModel } from '../user-auth.mapper';

describe('User Auth Mapper', () => {
  const createdAt = new Date('2026-05-01T00:00:00.000Z');
  const updatedAt = new Date('2026-05-01T01:00:00.000Z');
  const userId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;

  describe('toRepo', () => {
    it('maps user auth to a repo model', () => {
      const userAuth: IUserAuth = {
        userId,
        password: 'hashed-password',
        failedLoginAttempts: 2,
        strategy: [EAuthStrategy.Email],
        createdAt,
        updatedAt,
      };

      expect(userAuthMapper.toRepo(userAuth)).toEqual({
        userId,
        password: 'hashed-password',
        failedLoginAttempts: 2,
        strategies: [EAuthStrategy.Email],
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      });
    });

    it('maps a null password to repo null', () => {
      const userAuth: IUserAuth = {
        userId,
        password: null,
        failedLoginAttempts: 0,
        strategy: [EAuthStrategy.Google],
        createdAt,
        updatedAt,
      };

      expect(userAuthMapper.toRepo(userAuth).password).toBeNull();
    });
  });

  describe('toDomain', () => {
    it('maps a repo model to user auth', () => {
      const model: IUserAuthModel = {
        userId,
        password: 'hashed-password',
        failedLoginAttempts: 1,
        strategies: [EAuthStrategy.Email, EAuthStrategy.Google],
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      };

      expect(userAuthMapper.toDomain(model)).toEqual({
        userId,
        password: 'hashed-password',
        failedLoginAttempts: 1,
        strategy: [EAuthStrategy.Email, EAuthStrategy.Google],
        createdAt,
        updatedAt,
      });
    });

    it('defaults nullable repo fields for the domain shape', () => {
      const model: IUserAuthModel = {
        userId,
        password: null,
        failedLoginAttempts: null,
        strategies: [EAuthStrategy.Google],
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      };

      expect(userAuthMapper.toDomain(model)).toEqual({
        userId,
        password: null,
        failedLoginAttempts: 0,
        strategy: [EAuthStrategy.Google],
        createdAt,
        updatedAt,
      });
    });
  });
});
