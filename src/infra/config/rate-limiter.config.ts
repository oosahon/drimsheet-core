import { Request, Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

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

import { ErrorTooManyRequests } from '../../shared/value-objects/error';
import reporter from '../observability/reporter';

export function configureRateLimiter(config: IConfig) {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: config.message || RATE_LIMITER_MESSAGE,
    ...(config.keyGenerator
      ? {
          keyGenerator: async (req: Request, res: Response) => {
            const key = await config.keyGenerator!(req, res);
            return key || (req.ip ? ipKeyGenerator(req.ip, 64) : 'unknown-ip');
          },
        }
      : { ipv6Subnet: 64 }),
    legacyHeaders: false,
    standardHeaders: true,
    handler: (req, res, next, options) => {
      const rateLimitInfo = (req as any).rateLimit;

      if (rateLimitInfo && rateLimitInfo.used === rateLimitInfo.limit + 1) {
        reporter.reportAbuse('Too many requests to API', {
          method: req.method,
          url: req.originalUrl,
          ip: req.ip || req.headers['x-forwarded-for'],
          userAgent: req.headers['user-agent'],
        });
      }

      throw new ErrorTooManyRequests(options.message, {
        cause: {
          used: rateLimitInfo.used,
          limit: rateLimitInfo.limit,
        },
      });
    },
  });
}
