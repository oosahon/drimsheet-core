import {
  configureRateLimiter,
  RATE_LIMITER_MAX,
  RATE_LIMITER_WINDOW_MS,
} from '../config/rate-limiter.config';

export default function rateLimiter() {
  return configureRateLimiter({
    windowMs: RATE_LIMITER_WINDOW_MS,
    max: RATE_LIMITER_MAX,
  });
}
