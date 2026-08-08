import { RequestHandler } from 'express';

import {
  AUTH_RATE_LIMITER_MESSAGE,
  configureRateLimiter,
  makeAccountRateLimitKey,
} from '@infra/config/rate-limiter.config';
import { JWT_SECRET_KEY } from '@infra/config/vars.config';

export default function makeSignupRateLimitMiddlewares(): [
  RequestHandler,
  RequestHandler,
] {
  const ipRateLimiter = configureRateLimiter({
    windowMs: 1000 * 60,
    max: 20,
    message: AUTH_RATE_LIMITER_MESSAGE,
  });

  const accountRateLimiter = configureRateLimiter({
    windowMs: 1000 * 60,
    max: 5,
    message: AUTH_RATE_LIMITER_MESSAGE,
    keyGenerator: (req) =>
      makeAccountRateLimitKey(
        'signup-with-email',
        req.body?.email,
        JWT_SECRET_KEY
      ),
  });

  return [ipRateLimiter, accountRateLimiter];
}
