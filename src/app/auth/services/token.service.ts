import {
  JsonWebTokenError,
  NotBeforeError,
  sign,
  TokenExpiredError,
  verify,
} from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { ICacheStorage } from '../../../shared/contracts/cache-storage.contract';
import IVarsConfig from '../../../shared/contracts/vars-config.contract';
import ITokenService, {
  IAuthTokenPayload,
} from '../contracts/token-service.contract';
import authError from '../errors/auth.error';

interface IDependencies {
  cacheStorage: ICacheStorage;
  varsConfig: IVarsConfig;
}

export default function makeTokenService(deps: IDependencies): ITokenService {
  const handleJwtError = (err: unknown): never => {
    if (err instanceof TokenExpiredError) {
      throw new authError.ExpiredToken();
    }
    if (err instanceof NotBeforeError) {
      throw new authError.InvalidToken();
    }
    if (err instanceof JsonWebTokenError) {
      throw new authError.MalformedToken();
    }
    throw new authError.InvalidToken();
  };

  const verifyAuthToken = (token: string) => {
    try {
      return verify(token, deps.varsConfig.JWT_SECRET_KEY, {
        algorithms: ['HS256'],
      }) as IAuthTokenPayload & {
        exp?: number;
        type: string;
      };
    } catch (err) {
      return handleJwtError(err);
    }
  };

  const generateSignupToken: ITokenService['generateSignupToken'] = async ({
    id,
  }) => {
    const token = sign(
      {
        id,
        type: 'signup',
      },
      deps.varsConfig.JWT_SECRET_KEY,
      { expiresIn: '1day', algorithm: 'HS256' }
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
    const token = sign({ id, type: 'access' }, deps.varsConfig.JWT_SECRET_KEY, {
      expiresIn: ttlSeconds,
      algorithm: 'HS256',
      jwtid: randomUUID(),
    });

    return token;
  };

  const generateRefreshToken: ITokenService['generateRefreshToken'] = async ({
    id,
  }) => {
    const ttlSeconds = 60 * 60 * 24 * 15; // 15 days
    const token = sign(
      {
        id,
        type: 'refresh',
      },
      deps.varsConfig.JWT_SECRET_KEY,
      {
        expiresIn: ttlSeconds,
        algorithm: 'HS256',
        jwtid: randomUUID(),
      }
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
      const token = sign(
        {
          id,
          type: 'reset',
        },
        deps.varsConfig.JWT_SECRET_KEY,
        { expiresIn: ttlSeconds }
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
