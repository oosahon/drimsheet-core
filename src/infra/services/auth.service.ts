import bcrypt from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import IAuthService, {
  IAuthTokenPayload,
} from '../../app/contracts/infra/auth-service.contract';
import { ICacheStorage } from '../../app/contracts/infra/cache-storage.contract';
import { NON_PROD_EMAIL_WHITELIST } from '../config/email-whitelist.config';
import { JWT_SECRET_KEY, NODE_ENV } from '../config/vars.config';

export default function makeAuthService(
  cacheStorage: ICacheStorage
): IAuthService {
  const verifyAuthToken = (token: string) =>
    verify(token, JWT_SECRET_KEY) as IAuthTokenPayload & { type: string };

  return {
    hashPassword: async (password) => {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      return hash;
    },

    async generateSignupToken({ id }) {
      const token = sign(
        {
          id,
          type: 'signup',
        },
        JWT_SECRET_KEY,
        { expiresIn: '1day' }
      );

      await cacheStorage.set(
        `app:auth:signup-token:${id}`,
        token,
        60 * 60 * 24
      );
      return token;
    },

    async verifySignupToken(token) {
      try {
        const decoded = verifyAuthToken(token);

        if (decoded.type !== 'signup') return null;

        const cachedToken = await cacheStorage.get<string>(
          `app:auth:signup-token:${decoded.id}`
        );

        if (!cachedToken) {
          return null;
        }

        const isValid = cachedToken === token ? decoded : null;

        if (isValid) {
          await cacheStorage.del(`app:auth:signup-token:${decoded.id}`);
        }

        return isValid;
      } catch (err) {
        return null;
      }
    },

    comparePassword: async (passwordString, hashedPassword) => {
      return await bcrypt.compare(passwordString, hashedPassword);
    },

    generateAccessToken: async ({ id }) => {
      const ttlSeconds = 60 * 15; // 15 minutes
      const token = sign({ id, type: 'access' }, JWT_SECRET_KEY, {
        expiresIn: ttlSeconds,
      });

      return token;
    },

    generateRefreshToken: async ({ id }) => {
      const ttlSeconds = 60 * 60 * 24 * 15; // 15 days
      const token = sign(
        {
          id,
          type: 'refresh',
        },
        JWT_SECRET_KEY,
        { expiresIn: ttlSeconds }
      );

      return token;
    },

    verifyRefreshToken(token) {
      try {
        const { type, ...decoded } = verifyAuthToken(token);

        if (type !== 'refresh') return null;

        return decoded;
      } catch (err) {
        return null;
      }
    },

    async generatePasswordResetToken({ id }) {
      const ttlSeconds = 2 * 60 * 60; // 2 hours
      const token = sign(
        {
          id,
          type: 'reset',
        },
        JWT_SECRET_KEY,
        { expiresIn: ttlSeconds }
      );
      await cacheStorage.set(`app:auth:reset-token:${id}`, token, ttlSeconds);

      return token;
    },

    async verifyPasswordResetToken(token) {
      try {
        const decoded = verifyAuthToken(token);

        if (decoded.type !== 'reset') return null;

        const cachedToken = await cacheStorage.get<string>(
          `app:auth:reset-token:${decoded.id}`
        );

        if (!cachedToken) {
          return null;
        }

        const isValid = cachedToken === token ? decoded : null;

        if (isValid) {
          await cacheStorage.del(`app:auth:reset-token:${decoded.id}`);
        }

        return isValid;
      } catch (err) {
        return null;
      }
    },

    verifyAuthToken,

    async getAuthUser(token: string) {
      try {
        const decoded = verifyAuthToken(token);

        if (decoded.type !== 'access') return null;

        return decoded;
      } catch (err) {
        return null;
      }
    },

    isPermittedEmail(email: string) {
      if (NODE_ENV === 'local' || NODE_ENV === 'test') return true;

      const isProd = NODE_ENV === 'production';
      return isProd ? true : NON_PROD_EMAIL_WHITELIST.includes(email);
    },
  };
}
