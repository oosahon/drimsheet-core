import { randomUUID } from 'node:crypto';

import jsonWebToken, {
  JsonWebTokenError,
  NotBeforeError,
  TokenExpiredError,
} from 'jsonwebtoken';

import { ICacheStorage } from '@shared/contracts/cache-storage.contract';

import ITokenService, {
  IAuthTokenPayload,
} from '@app/auth/contracts/token-service.contract';
import authError from '@app/auth/errors/auth.error';

interface IDependencies {
  cacheStorage: ICacheStorage;
  secret: string;
}

export default function makeTokenService(deps: IDependencies): ITokenService {
  const encodeToken = (
    payload: Record<string, unknown>,
    expiresInSeconds: number,
    tokenId?: string
  ) =>
    jsonWebToken.sign(payload, deps.secret, {
      algorithm: 'HS256',
      expiresIn: expiresInSeconds,
      ...(tokenId ? { jwtid: tokenId } : {}),
    });

  const verifyAuthToken = (token: string) => {
    try {
      return jsonWebToken.verify(token, deps.secret, {
        algorithms: ['HS256'],
      }) as IAuthTokenPayload & { exp?: number; type: string };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new authError.ExpiredToken();
      }
      if (error instanceof NotBeforeError) {
        throw new authError.InvalidToken();
      }
      if (error instanceof JsonWebTokenError) {
        throw new authError.MalformedToken();
      }

      throw new authError.InvalidToken();
    }
  };

  const generateSignupToken: ITokenService['generateSignupToken'] = async ({
    id,
  }) => {
    const token = encodeToken(
      {
        id,
        type: 'signup',
      },
      60 * 60 * 24
    );

    await deps.cacheStorage.set(
      `app:auth:signup-token:${id}`,
      token,
      60 * 60 * 24
    );
    return token;
  };

  const claimSignupToken: ITokenService['claimSignupToken'] = async (token) => {
    const decoded = verifyAuthToken(token);

    if (decoded.type !== 'signup' || !decoded.id) {
      throw new authError.InvalidToken();
    }

    const cachedToken = await deps.cacheStorage.get<string>(
      `app:auth:signup-token:${decoded.id}`
    );

    if (!cachedToken || cachedToken !== token) {
      throw new authError.InvalidToken();
    }

    const claimed = await deps.cacheStorage.setIfNotExists(
      `app:auth:signup-token-claim:${decoded.id}`,
      token,
      30
    );

    if (!claimed) {
      throw new authError.InvalidToken();
    }

    return decoded;
  };

  const finalizeSignupToken: ITokenService['finalizeSignupToken'] = async (
    id
  ) => {
    await deps.cacheStorage.del(`app:auth:signup-token:${id}`);
    await deps.cacheStorage.del(`app:auth:signup-token-claim:${id}`);
  };

  const releaseSignupTokenClaim: ITokenService['releaseSignupTokenClaim'] =
    async (id) => {
      await deps.cacheStorage.del(`app:auth:signup-token-claim:${id}`);
    };

  const verifySignupToken: ITokenService['verifySignupToken'] = async (
    token
  ) => {
    const decoded = await claimSignupToken(token);
    await finalizeSignupToken(decoded.id);
    return decoded;
  };

  const generateAccessToken: ITokenService['generateAccessToken'] = async ({
    id,
  }) => {
    const ttlSeconds = 60 * 15; // 15 minutes
    const token = encodeToken({ id, type: 'access' }, ttlSeconds, randomUUID());

    return token;
  };

  const generateRefreshToken: ITokenService['generateRefreshToken'] = async ({
    id,
  }) => {
    const ttlSeconds = 60 * 60 * 24 * 15; // 15 days
    const token = encodeToken(
      {
        id,
        type: 'refresh',
      },
      ttlSeconds,
      randomUUID()
    );

    return token;
  };

  const verifyRefreshToken: ITokenService['verifyRefreshToken'] = (token) => {
    const { type, ...decoded } = verifyAuthToken(token);

    if (type !== 'refresh') {
      throw new authError.InvalidToken();
    }

    return decoded;
  };

  const generatePasswordResetToken: ITokenService['generatePasswordResetToken'] =
    async ({ id }) => {
      const ttlSeconds = 2 * 60 * 60; // 2 hours
      const token = encodeToken(
        {
          id,
          type: 'reset',
        },
        ttlSeconds
      );
      await deps.cacheStorage.set(
        `app:auth:reset-token:${id}`,
        token,
        ttlSeconds
      );

      return token;
    };

  const claimPasswordResetToken: ITokenService['claimPasswordResetToken'] =
    async (token) => {
      const decoded = verifyAuthToken(token);

      if (decoded.type !== 'reset' || !decoded.id) {
        throw new authError.InvalidToken();
      }

      const cachedToken = await deps.cacheStorage.get<string>(
        `app:auth:reset-token:${decoded.id}`
      );

      if (!cachedToken || cachedToken !== token) {
        throw new authError.InvalidToken();
      }

      const owner = randomUUID();
      const nowSeconds = Math.floor(Date.now() / 1000);
      const claimTtlSeconds = Math.max(
        1,
        (decoded.exp ?? nowSeconds + 1) - nowSeconds
      );
      const claimed = await deps.cacheStorage.setIfNotExists(
        `app:auth:reset-token-claim:${decoded.id}`,
        owner,
        claimTtlSeconds
      );
      if (!claimed) {
        throw new authError.InvalidToken();
      }

      return { id: decoded.id, owner };
    };

  const finalizePasswordResetToken: ITokenService['finalizePasswordResetToken'] =
    async (claim) => {
      await deps.cacheStorage.deleteIfValueMatches(
        `app:auth:reset-token-claim:${claim.id}`,
        claim.owner,
        [`app:auth:reset-token:${claim.id}`]
      );
    };

  const releasePasswordResetTokenClaim: ITokenService['releasePasswordResetTokenClaim'] =
    async (claim) => {
      await deps.cacheStorage.deleteIfValueMatches(
        `app:auth:reset-token-claim:${claim.id}`,
        claim.owner
      );
    };

  const verifyPasswordResetToken: ITokenService['verifyPasswordResetToken'] =
    async (token) => {
      const decoded = await claimPasswordResetToken(token);
      await finalizePasswordResetToken(decoded);
      return decoded;
    };

  const getAuthUser: ITokenService['getAuthUser'] = async (token) => {
    const decoded = verifyAuthToken(token);

    if (decoded.type !== 'access') {
      throw new authError.InvalidToken();
    }

    return decoded;
  };

  return Object.freeze({
    generateSignupToken,
    verifySignupToken,
    claimSignupToken,
    finalizeSignupToken,
    releaseSignupTokenClaim,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    generatePasswordResetToken,
    verifyPasswordResetToken,
    claimPasswordResetToken,
    finalizePasswordResetToken,
    releasePasswordResetTokenClaim,
    getAuthUser,
  });
}
