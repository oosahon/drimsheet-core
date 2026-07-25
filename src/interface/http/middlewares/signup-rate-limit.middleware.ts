import { RequestHandler } from 'express';
import {
  configureRateLimiter,
  makeAccountRateLimitKey,
} from '../../../infra/config/rate-limiter.config';
import { JWT_SECRET_KEY } from '../../../infra/config/vars.config';

const SIGNUP_RATE_LIMIT_MESSAGE =
  'Too many signup attempts, please try again later.';

export default function makeSignupRateLimitMiddlewares(): [
  RequestHandler,
  RequestHandler,
] {
  const ipRateLimiter = configureRateLimiter({
    windowMs: 1000 * 60,
    max: 20,
    message: SIGNUP_RATE_LIMIT_MESSAGE,
  });

  const accountRateLimiter = configureRateLimiter({
    windowMs: 1000 * 60,
    max: 5,
    message: SIGNUP_RATE_LIMIT_MESSAGE,
    keyGenerator: (req) =>
      makeAccountRateLimitKey(
        'signup-with-email',
        req.body?.email,
        JWT_SECRET_KEY
      ),
  });

  return [ipRateLimiter, accountRateLimiter];
}
