import { Request, Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { createHmac } from 'node:crypto';
import emailValue from '../../domain/user/values/email.vo';

/**
 * 700 requests per 15 minutes
 */
export const RATE_LIMITER_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMITER_MAX = 700;

export const RATE_LIMITER_MESSAGE =
  'Too many requests from this IP, please try again later.';

interface IConfig {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (
    req: Request,
    res: Response
  ) => string | undefined | Promise<string | undefined>;
}

interface IRateLimitRequest extends Request {
  rateLimit: {
    used: number;
    limit: number;
  };
}

import appError from '../../shared/errors/app.error';
import reporter from '../observability/reporter';

export type RateLimitAction =
  | 'signup-with-email'
  | 'login-with-email'
  | 'verify-email'
  | 'get-password-reset-link'
  | 'reset-password'
  | 'refresh-access-token';

export function makeAccountRateLimitKey(
  action: RateLimitAction,
  input: unknown,
  secret: string
): string | undefined {
  if (typeof input !== 'string') {
    return undefined;
  }

  try {
    const email = emailValue.make(input);
    const digest = createHmac('sha256', secret).update(email).digest('hex');
    return `account:${action}:${digest}`;
  } catch {
    return undefined;
  }
}

export function makeIpRateLimitKey(input: unknown): string {
  if (typeof input !== 'string' || input.length === 0) {
    return 'ip:unknown';
  }

  return `ip:${ipKeyGenerator(input, 64)}`;
}

export function makeHashedRateLimitKey(
  action: RateLimitAction,
  input: unknown,
  secret: string
): string | undefined {
  if (typeof input !== 'string' || input.trim().length === 0) {
    return undefined;
  }

  try {
    const digest = createHmac('sha256', secret)
      .update(input.trim())
      .digest('hex');
    return `hashed:${action}:${digest}`;
  } catch {
    return undefined;
  }
}

const rateLimiter = {
  loginWithEmail: configureRateLimiter({
    windowMs: 1000 * 60,
    max: 5,
    message: 'Too many authentication attempts, please try again later.',
    keyGenerator: (req) =>
      makeAccountRateLimitKey(
        'login-with-email',
        req.body?.email,
        process.env.JWT_SECRET_KEY || 'secret'
      ),
  }),

  verifyEmail: configureRateLimiter({
    windowMs: 1000 * 60 * 15,
    max: 5,
    message: 'Too many email verification attempts, please try again later.',
    keyGenerator: (req) =>
      makeHashedRateLimitKey(
        'verify-email',
        req.body?.token,
        process.env.JWT_SECRET_KEY || 'secret'
      ),
  }),

  getPasswordResetLink: configureRateLimiter({
    windowMs: 1000 * 60 * 5,
    max: 5,
    message:
      'Too many password reset requests for this account, please try again.',
    keyGenerator: (req) =>
      makeAccountRateLimitKey(
        'get-password-reset-link',
        req.body?.email,
        process.env.JWT_SECRET_KEY || 'secret'
      ),
  }),

  getPasswordResetLinkByIp: configureRateLimiter({
    windowMs: 1000 * 60 * 5,
    max: 20,
    message: 'Too many password reset requests, please try again later.',
    keyGenerator: (req) => makeIpRateLimitKey(req.ip),
  }),

  resetPassword: configureRateLimiter({
    windowMs: 1000 * 60 * 15,
    max: 5,
    message: 'Too many password reset attempts, please try again later.',
    keyGenerator: (req) =>
      makeHashedRateLimitKey(
        'reset-password',
        req.body?.token,
        process.env.JWT_SECRET_KEY || 'secret'
      ),
  }),

  resetPasswordByIp: configureRateLimiter({
    windowMs: 1000 * 60 * 15,
    max: 20,
    message: 'Too many password reset attempts, please try again later.',
    keyGenerator: (req) => makeIpRateLimitKey(req.ip),
  }),

  refreshAccessToken: configureRateLimiter({
    windowMs: 1000 * 60,
    max: 10,
    message: 'Too many token refresh attempts, please try again later.',
    keyGenerator: (req) =>
      makeHashedRateLimitKey(
        'refresh-access-token',
        req.cookies?.refresh_token,
        process.env.JWT_SECRET_KEY || 'secret'
      ),
  }),
};

export { rateLimiter };

export function configureRateLimiter(config: IConfig) {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: config.message || RATE_LIMITER_MESSAGE,
    ...(config.keyGenerator
      ? {
          keyGenerator: async (req: Request, res: Response) => {
            const key = await config.keyGenerator!(req, res);
            return key || makeIpRateLimitKey(req.ip);
          },
        }
      : {
          keyGenerator: (req: Request) => makeIpRateLimitKey(req.ip),
        }),
    // The configured generators delegate IPv6 normalization to
    // makeIpRateLimitKey; express-rate-limit cannot detect that through a helper.
    validate: { keyGeneratorIpFallback: false },
    legacyHeaders: false,
    standardHeaders: true,
    handler: (req, res, next, options) => {
      const rateLimitInfo = (req as IRateLimitRequest).rateLimit;

      if (rateLimitInfo.used === rateLimitInfo.limit + 1) {
        reporter.reportAbuse('Too many requests to API', {
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }

      throw new appError.TooManyRequests({
        used: rateLimitInfo.used,
        limit: rateLimitInfo.limit,
        message: options.message,
      });
    },
  });
}
