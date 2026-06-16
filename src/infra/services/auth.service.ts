import bcrypt from 'bcryptjs';
import {
  JsonWebTokenError,
  NotBeforeError,
  sign,
  TokenExpiredError,
  verify,
} from 'jsonwebtoken';
import IAuthService, {
  IAuthTokenPayload,
} from '../../app/auth/contracts/auth-service.contract';
import authError from '../../app/auth/errors/auth.error';
import { ICacheStorage } from '../../shared/contracts/cache-storage.contract';
import IVarsConfig from '../../shared/contracts/vars-config.contract';

export default function makeAuthService(
  cacheStorage: ICacheStorage,
  varsConfig: IVarsConfig,
  nonProdEmailWhitelist: string[]
): IAuthService {
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
      return verify(token, varsConfig.JWT_SECRET_KEY) as IAuthTokenPayload & {
        type: string;
      };
    } catch (err) {
      return handleJwtError(err);
    }
  };

  const hashPassword: IAuthService['hashPassword'] = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  };

  const generateSignupToken: IAuthService['generateSignupToken'] = async ({
    id,
  }) => {
    const token = sign(
      {
        id,
        type: 'signup',
      },
      varsConfig.JWT_SECRET_KEY,
      { expiresIn: '1day' }
    );

    await cacheStorage.set(`app:auth:signup-token:${id}`, token, 60 * 60 * 24);
    return token;
  };

  const verifySignupToken: IAuthService['verifySignupToken'] = async (
    token
  ) => {
    const decoded = verifyAuthToken(token);

    if (decoded.type !== 'signup') {
      throw new authError.InvalidToken();
    }

    const cachedToken = await cacheStorage.get<string>(
      `app:auth:signup-token:${decoded.id}`
    );

    if (!cachedToken || cachedToken !== token) {
      throw new authError.InvalidToken();
    }

    await cacheStorage.del(`app:auth:signup-token:${decoded.id}`);

    return decoded;
  };

  const comparePassword: IAuthService['comparePassword'] = async (
    passwordString,
    hashedPassword
  ) => {
    return await bcrypt.compare(passwordString, hashedPassword);
  };

  const generateAccessToken: IAuthService['generateAccessToken'] = async ({
    id,
  }) => {
    const ttlSeconds = 60 * 15; // 15 minutes
    const token = sign({ id, type: 'access' }, varsConfig.JWT_SECRET_KEY, {
      expiresIn: ttlSeconds,
    });

    return token;
  };

  const generateRefreshToken: IAuthService['generateRefreshToken'] = async ({
    id,
  }) => {
    const ttlSeconds = 60 * 60 * 24 * 15; // 15 days
    const token = sign(
      {
        id,
        type: 'refresh',
      },
      varsConfig.JWT_SECRET_KEY,
      { expiresIn: ttlSeconds }
    );

    return token;
  };

  const verifyRefreshToken: IAuthService['verifyRefreshToken'] = (token) => {
    const { type, ...decoded } = verifyAuthToken(token);

    if (type !== 'refresh') {
      throw new authError.InvalidToken();
    }

    return decoded;
  };

  const generatePasswordResetToken: IAuthService['generatePasswordResetToken'] =
    async ({ id }) => {
      const ttlSeconds = 2 * 60 * 60; // 2 hours
      const token = sign(
        {
          id,
          type: 'reset',
        },
        varsConfig.JWT_SECRET_KEY,
        { expiresIn: ttlSeconds }
      );
      await cacheStorage.set(`app:auth:reset-token:${id}`, token, ttlSeconds);

      return token;
    };

  const verifyPasswordResetToken: IAuthService['verifyPasswordResetToken'] =
    async (token) => {
      const decoded = verifyAuthToken(token);

      if (decoded.type !== 'reset') {
        throw new authError.InvalidToken();
      }

      const cachedToken = await cacheStorage.get<string>(
        `app:auth:reset-token:${decoded.id}`
      );

      if (!cachedToken || cachedToken !== token) {
        throw new authError.InvalidToken();
      }

      await cacheStorage.del(`app:auth:reset-token:${decoded.id}`);

      return decoded;
    };

  const getAuthUser: IAuthService['getAuthUser'] = async (token) => {
    const decoded = verifyAuthToken(token);

    if (decoded.type !== 'access') {
      throw new authError.InvalidToken();
    }

    return decoded;
  };

  const isPermittedEmail: IAuthService['isPermittedEmail'] = (email) => {
    if (varsConfig.NODE_ENV === 'local' || varsConfig.NODE_ENV === 'test')
      return true;

    const isProd = varsConfig.NODE_ENV === 'production';
    return isProd ? true : nonProdEmailWhitelist.includes(email);
  };

  return Object.freeze({
    hashPassword,
    generateSignupToken,
    verifySignupToken,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    generatePasswordResetToken,
    verifyPasswordResetToken,
    verifyAuthToken,
    getAuthUser,
    isPermittedEmail,
  });
}
