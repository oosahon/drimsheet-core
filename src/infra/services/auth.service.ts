import bcrypt from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import IAuthService, {
  IAuthTokenPayload,
} from '../../app/contracts/infra/auth-service.contract';
import { ICacheStorage } from '../../app/contracts/infra/cache-storage.contract';
import { NON_PROD_EMAIL_WHITELIST } from '../config/email-whitelist.config';
import { JWT_SECRET_KEY, NODE_ENV } from '../config/vars.config';

export default function authService(cacheStorage: ICacheStorage): IAuthService {
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
      const decoded = verify(token, JWT_SECRET_KEY) as IAuthTokenPayload;

      const cachedToken = await cacheStorage.get<string>(
        `app:auth:signup-token:${decoded.id}`
      );

      if (!cachedToken) {
        return null;
      }

      return cachedToken === token ? decoded : null;
    },

    comparePassword: async (passwordString, hashedPassword) => {
      return await bcrypt.compare(passwordString, hashedPassword);
    },

    generateAccessToken: async ({ id }) => {
      const ttlSeconds = 60 * 15; // 15 minutes
      const token = sign({ id, type: 'access' }, JWT_SECRET_KEY, {
        expiresIn: ttlSeconds,
      });
      await cacheStorage.set(`app:auth:access-token:${id}`, token, ttlSeconds);

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
      await cacheStorage.set(`app:auth:refresh-token:${id}`, token, ttlSeconds);

      return token;
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
        const decoded = verify(token, JWT_SECRET_KEY) as IAuthTokenPayload;

        const cachedToken = await cacheStorage.get<string>(
          `app:auth:reset-token:${decoded.id}`
        );

        if (!cachedToken) {
          return null;
        }

        return cachedToken === token ? decoded : null;
      } catch (err) {
        return null;
      }
    },

    verifyAuthToken(token) {
      return verify(token, JWT_SECRET_KEY) as IAuthTokenPayload;
    },

    async getAuthUser(token: string) {
      try {
        const decoded = this.verifyAuthToken(token);

        const cachedToken = await cacheStorage.get<string>(
          `app:auth:access-token:${decoded.id}`
        );

        if (!cachedToken) {
          return null;
        }

        return cachedToken === token ? decoded : null;
      } catch (err) {
        return null;
      }
    },

    isPermittedEmail(email: string) {
      if (NODE_ENV === 'local') return true;

      const isProd = NODE_ENV === 'production';
      return isProd ? true : NON_PROD_EMAIL_WHITELIST.includes(email);
    },
  };
}
