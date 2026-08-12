import { RateLimitRequestHandler } from 'express-rate-limit';

import IReporter from '@shared/contracts/reporter.contract';
import IVarsConfig from '@shared/contracts/vars-config.contract';

import {
  AUTH_RATE_LIMITER_MESSAGE,
  configureRateLimiter,
  makeAccountRateLimitKey,
} from '@infra/config/rate-limiter.config';

export default function makeSignupRateLimitMiddlewares(
  vars: IVarsConfig,
  reporter: IReporter
): [RateLimitRequestHandler, RateLimitRequestHandler] {
  const ipRateLimiter = configureRateLimiter(
    {
      windowMs: 1000 * 60,
      max: 20,
      message: AUTH_RATE_LIMITER_MESSAGE,
    },
    reporter
  );

  const accountRateLimiter = configureRateLimiter(
    {
      windowMs: 1000 * 60,
      max: 5,
      message: AUTH_RATE_LIMITER_MESSAGE,
      keyGenerator: (req) =>
        makeAccountRateLimitKey(
          'signup-with-email',
          req.body?.email,
          vars.JWT_SECRET_KEY
        ),
    },
    reporter
  );

  return [ipRateLimiter, accountRateLimiter];
}
