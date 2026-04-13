import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

export const RATE_LIMITER_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMITER_MAX = 100;

export const RATE_LIMITER_MESSAGE =
  'Too many requests from this IP, please try again later.';

interface IConfig {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request, res: Response) => string | Promise<string>;
}

import reporter from '../observability/reporter';

export function configureRateLimiter(config: IConfig) {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: config.message || RATE_LIMITER_MESSAGE,
    keyGenerator: config.keyGenerator,
    legacyHeaders: false,
    standardHeaders: true,
    ipv6Subnet: 64,
    handler: (req, res, next, options) => {
      const rateLimitInfo = (req as any).rateLimit;

      // Only report abuse on the exact request that breached the limit
      if (rateLimitInfo && rateLimitInfo.used === rateLimitInfo.limit + 1) {
        reporter.reportAbuse('Too many requests to API', {
          method: req.method,
          url: req.originalUrl,
          ip: req.ip || req.headers['x-forwarded-for'],
          userAgent: req.headers['user-agent'],
        });
      }

      res.status(options.statusCode).send(options.message);
    },
  });
}
