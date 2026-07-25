import {
  JsonWebTokenError,
  NotBeforeError,
  sign,
  TokenExpiredError,
  verify,
} from 'jsonwebtoken';
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
      return verify(
        token,
        deps.varsConfig.JWT_SECRET_KEY
      ) as IAuthTokenPayload & {
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
      { expiresIn: '1day' }
    );

    await deps.cacheStorage.set(
      `app:auth:signup-token:${id}`,
      token,
      60 * 60 * 24
    );
    return token;
  };

  const verifySignupToken: ITokenService['verifySignupToken'] = async (
    token
  ) => {
    const decoded = verifyAuthToken(token);

    if (decoded.type !== 'signup') {
      throw new authError.InvalidToken();
    }

    const cachedToken = await deps.cacheStorage.get<string>(
      `app:auth:signup-token:${decoded.id}`
    );

    if (!cachedToken || cachedToken !== token) {
      throw new authError.InvalidToken();
    }

    await deps.cacheStorage.del(`app:auth:signup-token:${decoded.id}`);

    return decoded;
  };

  const generateAccessToken: ITokenService['generateAccessToken'] = async ({
    id,
  }) => {
    const ttlSeconds = 60 * 15; // 15 minutes
    const token = sign({ id, type: 'access' }, deps.varsConfig.JWT_SECRET_KEY, {
      expiresIn: ttlSeconds,
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
      { expiresIn: ttlSeconds }
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

  const verifyPasswordResetToken: ITokenService['verifyPasswordResetToken'] =
    async (token) => {
      const decoded = verifyAuthToken(token);

      if (decoded.type !== 'reset') {
        throw new authError.InvalidToken();
      }

      const cachedToken = await deps.cacheStorage.get<string>(
        `app:auth:reset-token:${decoded.id}`
      );

      if (!cachedToken || cachedToken !== token) {
        throw new authError.InvalidToken();
      }

      await deps.cacheStorage.del(`app:auth:reset-token:${decoded.id}`);

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
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    generatePasswordResetToken,
    verifyPasswordResetToken,
    getAuthUser,
  });
}
