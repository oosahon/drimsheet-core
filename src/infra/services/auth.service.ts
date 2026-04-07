import { sign, verify } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { WEB_APP_URL, JWT_SECRET_KEY, NODE_ENV } from '../config/vars.config';
import IAuthService, {
  IAuthTokenPayload,
} from '../../app/contracts/infra/auth-service.contract';
import { ICacheStorage } from '../../app/contracts/infra/cache-storage.contract';
import { NON_PROD_EMAIL_WHITELIST } from '../config/email-whitelist.config';

export default function authService(cacheStorage: ICacheStorage): IAuthService {
  return {
    hashPassword: async (password) => {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      return hash;
    },

    getSignupVerificationLink(payload) {
      const token = sign(payload, JWT_SECRET_KEY, { expiresIn: '1day' });
      return `${WEB_APP_URL}/auth/signup/complete?token=${token}`;
    },

    comparePassword: async (passwordString, hashedPassword) => {
      return await bcrypt.compare(passwordString, hashedPassword);
    },

    generateAuthToken: async (userData) => {
      const ttlSeconds = 1 * 24 * 60 * 60 * 30; // 30 days
      const token = sign(userData, JWT_SECRET_KEY, { expiresIn: ttlSeconds });
      await cacheStorage.set(`auth:token:${userData.id}`, token, ttlSeconds);

      return token;
    },

    generateRefreshToken: async (userData) => {
      const ttlSeconds = 90 * 24 * 60 * 60; // 90 days
      const token = sign(userData, JWT_SECRET_KEY, { expiresIn: ttlSeconds });
      await cacheStorage.set(
        `auth:refresh:token:${userData.id}`,
        token,
        ttlSeconds
      );

      return token;
    },

    async generatePasswordResetToken(userData) {
      const ttlSeconds = 2 * 60 * 60; // 2 hours
      const token = sign(userData, JWT_SECRET_KEY, { expiresIn: ttlSeconds });
      await cacheStorage.set(
        `auth:reset:token:${userData.id}`,
        token,
        ttlSeconds
      );

      return token;
    },

    async verifyPasswordResetToken(token) {
      try {
        const decoded = verify(token, JWT_SECRET_KEY) as IAuthTokenPayload;

        const cachedToken = await cacheStorage.get<string>(
          `auth:reset:token:${decoded.id}`
        );

        if (!cachedToken) {
          return null;
        }

        return cachedToken === token ? decoded : null;
      } catch (err) {
        return null;
      }
    },

    getResetPasswordLink(token) {
      return `${WEB_APP_URL}/auth/reset-password?token=${token}`;
    },

    verifyAuthToken(token) {
      return verify(token, JWT_SECRET_KEY) as IAuthTokenPayload;
    },

    async getAuthUser(token: string) {
      try {
        const decoded = this.verifyAuthToken(token);

        const cachedToken = await cacheStorage.get<string>(
          `auth:token:${decoded.id}`
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
      const isProd = NODE_ENV === 'production';
      return isProd ? true : NON_PROD_EMAIL_WHITELIST.includes(email);
    },
  };
}
