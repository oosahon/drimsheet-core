import { sign } from 'jsonwebtoken';
import { makeMockCacheStorage } from '../../../../shared/contracts/__mocks__/cache-storage.contract.mock';
import { ICacheStorage } from '../../../../shared/contracts/cache-storage.contract';
import IVarsConfig from '../../../../shared/contracts/vars-config.contract';
import { TEntityId } from '../../../../shared/types/uuid';
import authError from '../../errors/auth.error';
import makeAuthService from '../auth.service';

describe('makeAuthService', () => {
  let cacheStorage: ICacheStorage;
  let authService: ReturnType<typeof makeAuthService>;
  let varsConfig: IVarsConfig;

  beforeEach(() => {
    cacheStorage = makeMockCacheStorage();
    varsConfig = {
      JWT_SECRET_KEY: 'test-secret-key',
      NODE_ENV: 'test',
    } as IVarsConfig;

    authService = makeAuthService({
      cacheStorage,
      varsConfig,
      nonProdEmailWhitelist: ['osahonoboite@gmail.com'],
    });
  });

  describe('hashPassword & comparePassword', () => {
    it('should correctly hash and compare passwords', async () => {
      const password = 'mySecretPassword123!';
      const hash = await authService.hashPassword(password);

      expect(hash).not.toBe(password);

      const isMatch = await authService.comparePassword(password, hash);
      expect(isMatch).toBe(true);

      const isNotMatch = await authService.comparePassword(
        'wrongPassword',
        hash
      );
      expect(isNotMatch).toBe(false);
    });
  });

  describe('generateSignupToken & verifySignupToken', () => {
    const userId = 'user-123' as TEntityId;

    it('should successfully generate and verify a signup token', async () => {
      const token = await authService.generateSignupToken({ id: userId });
      expect(cacheStorage.set).toHaveBeenCalledWith(
        `app:auth:signup-token:${userId}`,
        token,
        expect.any(Number)
      );

      const decoded = await authService.verifySignupToken(token);
      expect(decoded.id).toBe(userId);

      // It should delete the token after successful verification
      expect(cacheStorage.del).toHaveBeenCalledWith(
        `app:auth:signup-token:${userId}`
      );
    });

    it('should throw InvalidToken if token type is incorrect', async () => {
      const wrongToken = await authService.generateAccessToken({ id: userId });

      await expect(authService.verifySignupToken(wrongToken)).rejects.toThrow(
        authError.InvalidToken
      );
    });

    it('should throw InvalidToken if token is missing from cache', async () => {
      const token = await authService.generateSignupToken({ id: userId });

      // Manually delete from cache to simulate expiry/consumption
      await cacheStorage.del(`app:auth:signup-token:${userId}`);

      await expect(authService.verifySignupToken(token)).rejects.toThrow(
        authError.InvalidToken
      );
    });

    it('should throw InvalidToken if cached token does not match provided token', async () => {
      const token = await authService.generateSignupToken({ id: userId });

      // Tamper with the cache
      await cacheStorage.set(
        `app:auth:signup-token:${userId}`,
        'some-other-token'
      );

      await expect(authService.verifySignupToken(token)).rejects.toThrow(
        authError.InvalidToken
      );
    });
  });

  describe('generatePasswordResetToken & verifyPasswordResetToken', () => {
    const userId = 'user-456' as TEntityId;

    it('should successfully generate and verify a reset token', async () => {
      const token = await authService.generatePasswordResetToken({
        id: userId,
      });
      expect(cacheStorage.set).toHaveBeenCalledWith(
        `app:auth:reset-token:${userId}`,
        token,
        expect.any(Number)
      );

      const decoded = await authService.verifyPasswordResetToken(token);
      expect(decoded.id).toBe(userId);

      // It should delete the token after successful verification
      expect(cacheStorage.del).toHaveBeenCalledWith(
        `app:auth:reset-token:${userId}`
      );
    });

    it('should throw InvalidToken if token type is incorrect', async () => {
      const wrongToken = await authService.generateAccessToken({ id: userId });

      await expect(
        authService.verifyPasswordResetToken(wrongToken)
      ).rejects.toThrow(authError.InvalidToken);
    });

    it('should throw InvalidToken if token is missing from cache', async () => {
      const token = await authService.generatePasswordResetToken({
        id: userId,
      });

      await cacheStorage.del(`app:auth:reset-token:${userId}`);

      await expect(authService.verifyPasswordResetToken(token)).rejects.toThrow(
        authError.InvalidToken
      );
    });
  });

  describe('generateAccessToken & getAuthUser', () => {
    const userId = 'user-789' as TEntityId;

    it('should successfully generate and decode an access token', async () => {
      const token = await authService.generateAccessToken({ id: userId });
      const decoded = await authService.getAuthUser(token);

      expect(decoded.id).toBe(userId);
    });

    it('should throw ExpiredToken for expired access tokens', async () => {
      // Manually sign an expired token
      const expiredToken = sign(
        { id: userId, type: 'access' },
        varsConfig.JWT_SECRET_KEY,
        {
          expiresIn: '-1s',
        }
      );

      await expect(authService.getAuthUser(expiredToken)).rejects.toThrow(
        authError.ExpiredToken
      );
    });

    it('should throw InvalidToken if token type is not access', async () => {
      const wrongToken = await authService.generateRefreshToken({ id: userId });

      await expect(authService.getAuthUser(wrongToken)).rejects.toThrow(
        authError.InvalidToken
      );
    });

    it('should throw MalformedToken for complete garbage tokens', async () => {
      await expect(authService.getAuthUser('not.a.real.jwt')).rejects.toThrow(
        authError.MalformedToken
      );
    });

    it('should throw InvalidToken for NotBeforeError', async () => {
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
        throw new jwt.NotBeforeError('jwt not active', new Date());
      });
      await expect(authService.getAuthUser('some-token')).rejects.toThrow(
        authError.InvalidToken
      );
    });

    it('should throw InvalidToken for unknown error during verification', async () => {
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
        throw new Error('unknown error');
      });
      await expect(authService.getAuthUser('some-token')).rejects.toThrow(
        authError.InvalidToken
      );
    });
  });

  describe('generateRefreshToken & verifyRefreshToken', () => {
    const userId = 'user-999' as TEntityId;

    it('should successfully generate and verify a refresh token', async () => {
      const token = await authService.generateRefreshToken({ id: userId });
      const decoded = await authService.verifyRefreshToken(token);

      expect(decoded.id).toBe(userId);
    });

    it('should throw InvalidToken if token type is incorrect', async () => {
      const wrongToken = await authService.generateAccessToken({ id: userId });

      expect(() => authService.verifyRefreshToken(wrongToken)).toThrow(
        authError.InvalidToken
      );
    });
  });

  describe('isPermittedEmail', () => {
    it('should return true for any email in test environments', () => {
      expect(authService.isPermittedEmail('random@email.com')).toBe(true);
    });

    it('should return true for any email in production environment', () => {
      const prodAuthService = makeAuthService({
        cacheStorage,
        varsConfig: { ...varsConfig, NODE_ENV: 'production' },
        nonProdEmailWhitelist: ['osahonoboite@gmail.com'],
      });

      expect(prodAuthService.isPermittedEmail('random@email.com')).toBe(true);
    });

    it('should use nonProdEmailWhitelist in staging environment', () => {
      const stagingAuthService = makeAuthService({
        cacheStorage,
        varsConfig: { ...varsConfig, NODE_ENV: 'staging' },
        nonProdEmailWhitelist: ['osahonoboite@gmail.com'],
      });

      expect(
        stagingAuthService.isPermittedEmail('osahonoboite@gmail.com')
      ).toBe(true);
      expect(stagingAuthService.isPermittedEmail('random@email.com')).toBe(
        false
      );
    });
  });
});
