import { rateLimit } from 'express-rate-limit';
import {
  RATE_LIMITER_MAX,
  RATE_LIMITER_WINDOW_MS,
  RATE_LIMITER_MESSAGE,
} from '../config/rate-limiter.config';

export default function rateLimiter() {
  return rateLimit({
    windowMs: RATE_LIMITER_WINDOW_MS,
    max: RATE_LIMITER_MAX,
    message: RATE_LIMITER_MESSAGE,
    legacyHeaders: false,
    standardHeaders: true,
    ipv6Subnet: 64,
  });
}
