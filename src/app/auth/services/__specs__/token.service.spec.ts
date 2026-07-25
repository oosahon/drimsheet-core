import { sign } from 'jsonwebtoken';
import { makeMockCacheStorage } from '../../../../shared/contracts/__mocks__/cache-storage.contract.mock';
import { ICacheStorage } from '../../../../shared/contracts/cache-storage.contract';
import IVarsConfig from '../../../../shared/contracts/vars-config.contract';
import { TEntityId } from '../../../../shared/types/uuid';
import authError from '../../errors/auth.error';
import makeTokenService from '../token.service';

describe('makeTokenService', () => {
  let cacheStorage: ICacheStorage;
  let tokenService: ReturnType<typeof makeTokenService>;
  let varsConfig: IVarsConfig;

  beforeEach(() => {
    cacheStorage = makeMockCacheStorage();
    varsConfig = {
      JWT_SECRET_KEY: 'test-secret-key',
      NODE_ENV: 'test',
    } as IVarsConfig;

    tokenService = makeTokenService({
      cacheStorage,
      varsConfig,
    });
  });

  describe('generateSignupToken & verifySignupToken', () => {
    const userId = 'user-123' as TEntityId;

    it('should successfully generate and verify a signup token', async () => {
      const token = await tokenService.generateSignupToken({ id: userId });
      expect(cacheStorage.set).toHaveBeenCalledWith(
        `app:auth:signup-token:${userId}`,
        token,
        expect.any(Number)
      );

      const decoded = await tokenService.verifySignupToken(token);
      expect(decoded.id).toBe(userId);

      // It should delete the token after successful verification
      expect(cacheStorage.del).toHaveBeenCalledWith(
        `app:auth:signup-token:${userId}`
      );
    });

    it('should throw InvalidToken if token type is incorrect', async () => {
      const wrongToken = await tokenService.generateAccessToken({ id: userId });

      await expect(tokenService.verifySignupToken(wrongToken)).rejects.toThrow(
        authError.InvalidToken
      );
    });

    it('should throw InvalidToken if token is missing from cache', async () => {
      const token = await tokenService.generateSignupToken({ id: userId });

      // Manually delete from cache to simulate expiry/consumption
      await cacheStorage.del(`app:auth:signup-token:${userId}`);

      await expect(tokenService.verifySignupToken(token)).rejects.toThrow(
        authError.InvalidToken
      );
    });

    it('should throw InvalidToken if cached token does not match provided token', async () => {
      const token = await tokenService.generateSignupToken({ id: userId });

      // Tamper with the cache
      await cacheStorage.set(
        `app:auth:signup-token:${userId}`,
        'some-other-token'
      );

      await expect(tokenService.verifySignupToken(token)).rejects.toThrow(
        authError.InvalidToken
      );
    });
  });

  describe('generatePasswordResetToken & verifyPasswordResetToken', () => {
    const userId = 'user-456' as TEntityId;

    it('should successfully generate and verify a reset token', async () => {
      const token = await tokenService.generatePasswordResetToken({
        id: userId,
      });
      expect(cacheStorage.set).toHaveBeenCalledWith(
        `app:auth:reset-token:${userId}`,
        token,
        expect.any(Number)
      );

      const decoded = await tokenService.verifyPasswordResetToken(token);
      expect(decoded.id).toBe(userId);

      expect(cacheStorage.deleteIfValueMatches).toHaveBeenCalledWith(
        `app:auth:reset-token-claim:${userId}`,
        expect.any(String),
        [`app:auth:reset-token:${userId}`]
      );
    });

    it('should throw InvalidToken if token type is incorrect', async () => {
      const wrongToken = await tokenService.generateAccessToken({ id: userId });

      await expect(
        tokenService.verifyPasswordResetToken(wrongToken)
      ).rejects.toThrow(authError.InvalidToken);
    });

    it('should throw InvalidToken if token is missing from cache', async () => {
      const token = await tokenService.generatePasswordResetToken({
        id: userId,
      });

      await cacheStorage.del(`app:auth:reset-token:${userId}`);

      await expect(
        tokenService.verifyPasswordResetToken(token)
      ).rejects.toThrow(authError.InvalidToken);
    });

    it('allows exactly one concurrent claim and permits retry after release', async () => {
      const token = await tokenService.generatePasswordResetToken({
        id: userId,
      });

      const claims = await Promise.allSettled([
        tokenService.claimPasswordResetToken(token),
        tokenService.claimPasswordResetToken(token),
      ]);

      expect(
        claims.filter(({ status }) => status === 'fulfilled')
      ).toHaveLength(1);
      expect(claims.filter(({ status }) => status === 'rejected')).toHaveLength(
        1
      );

      const successfulClaim = claims.find(
        (claim) => claim.status === 'fulfilled'
      );
      if (!successfulClaim || successfulClaim.status !== 'fulfilled') {
        throw new Error('Expected a successful reset-token claim');
      }
      await tokenService.releasePasswordResetTokenClaim(successfulClaim.value);
      await expect(
        tokenService.claimPasswordResetToken(token)
      ).resolves.toMatchObject({ id: userId });
    });

    it('does not let a stale owner release or finalize another claim', async () => {
      const token = await tokenService.generatePasswordResetToken({
        id: userId,
      });
      const claim = await tokenService.claimPasswordResetToken(token);
      const staleClaim = { ...claim, owner: 'stale-owner' };

      await tokenService.releasePasswordResetTokenClaim(staleClaim);
      await expect(tokenService.claimPasswordResetToken(token)).rejects.toThrow(
        authError.InvalidToken
      );

      await tokenService.finalizePasswordResetToken(staleClaim);
      await tokenService.releasePasswordResetTokenClaim(claim);
      await expect(
        tokenService.claimPasswordResetToken(token)
      ).resolves.toMatchObject({ id: userId });
    });
  });

  describe('generateAccessToken & getAuthUser', () => {
    const userId = 'user-789' as TEntityId;

    it('should successfully generate and decode an access token', async () => {
      const token = await tokenService.generateAccessToken({ id: userId });
      const decoded = await tokenService.getAuthUser(token);

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

      await expect(tokenService.getAuthUser(expiredToken)).rejects.toThrow(
        authError.ExpiredToken
      );
    });

    it('should throw InvalidToken if token type is not access', async () => {
      const wrongToken = await tokenService.generateRefreshToken({
        id: userId,
      });

      await expect(tokenService.getAuthUser(wrongToken)).rejects.toThrow(
        authError.InvalidToken
      );
    });

    it('should throw MalformedToken for complete garbage tokens', async () => {
      await expect(tokenService.getAuthUser('not.a.real.jwt')).rejects.toThrow(
        authError.MalformedToken
      );
    });

    it('should throw InvalidToken for NotBeforeError', async () => {
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
        throw new jwt.NotBeforeError('jwt not active', new Date());
      });
      await expect(tokenService.getAuthUser('some-token')).rejects.toThrow(
        authError.InvalidToken
      );
    });

    it('should throw InvalidToken for unknown error during verification', async () => {
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
        throw new Error('unknown error');
      });
      await expect(tokenService.getAuthUser('some-token')).rejects.toThrow(
        authError.InvalidToken
      );
    });
  });

  describe('generateRefreshToken & verifyRefreshToken', () => {
    const userId = 'user-999' as TEntityId;

    it('should successfully generate and verify a refresh token', async () => {
      const token = await tokenService.generateRefreshToken({ id: userId });
      const decoded = await tokenService.verifyRefreshToken(token);

      expect(decoded.id).toBe(userId);
    });

    it('should throw InvalidToken if token type is incorrect', async () => {
      const wrongToken = await tokenService.generateAccessToken({ id: userId });

      expect(() => tokenService.verifyRefreshToken(wrongToken)).toThrow(
        authError.InvalidToken
      );
    });
  });
});
