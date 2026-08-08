import appError from '@shared/values/errors/app.error';

import {
  AUTH_RATE_LIMITER_MESSAGE,
  configureRateLimiter,
  makeAccountRateLimitKey,
  makeHashedRateLimitKey,
  makeIpRateLimitKey,
  RATE_LIMITER_MESSAGE,
  rateLimiter,
} from '@infra/config/rate-limiter.config';
import reporter from '@infra/observability/reporter';

jest.mock('../../observability/reporter', () => ({
  __esModule: true,
  default: {
    reportAbuse: jest.fn(),
  },
}));

describe('rate limiter messages', () => {
  it('uses an auth error key for auth rate limits', () => {
    expect(AUTH_RATE_LIMITER_MESSAGE).toBe('auth_error_too_many_requests');
  });

  it('uses an app error key for the default rate limit', () => {
    expect(RATE_LIMITER_MESSAGE).toBe('app_error_too_many_requests');
  });
});

describe('makeAccountRateLimitKey', () => {
  const secret = 'test-rate-limit-secret';

  it('normalizes case and whitespace into the same account bucket', () => {
    const canonical = makeAccountRateLimitKey(
      'signup-with-email',
      'person@example.com',
      secret
    );
    const variant = makeAccountRateLimitKey(
      'signup-with-email',
      '  PERSON@EXAMPLE.COM  ',
      secret
    );

    expect(variant).toBe(canonical);
  });

  it('separates actions', () => {
    const signup = makeAccountRateLimitKey(
      'signup-with-email',
      'person@example.com',
      secret
    );
    const login = makeAccountRateLimitKey(
      'login-with-email',
      'person@example.com',
      secret
    );

    expect(signup).not.toBe(login);
  });

  it.each([undefined, null, 42, {}, [], 'not-an-email'])(
    'falls back to the IP bucket for malformed input %#',
    (input) => {
      expect(
        makeAccountRateLimitKey('signup-with-email', input, secret)
      ).toBeUndefined();
    }
  );

  it('does not put email PII in the key', () => {
    const email = 'private.person@example.com';
    const key = makeAccountRateLimitKey('signup-with-email', email, secret);

    expect(key).toMatch(/^account:signup-with-email:[a-f0-9]{64}$/);
    expect(key).not.toContain(email);
    expect(key).not.toContain('private.person');
  });

  it('protects reset requests with the same normalized PII-free key', () => {
    const email = 'Private.Person@example.com';
    const key = makeAccountRateLimitKey(
      'get-password-reset-link',
      `  ${email}  `,
      secret
    );

    expect(key).toMatch(/^account:get-password-reset-link:[a-f0-9]{64}$/);
    expect(key).not.toContain(email.toLowerCase());
  });
});

describe('makeIpRateLimitKey', () => {
  it('keeps IPv4 addresses distinct', () => {
    expect(makeIpRateLimitKey('192.0.2.1')).not.toBe(
      makeIpRateLimitKey('192.0.2.2')
    );
  });

  it('groups IPv6 addresses by the configured /64 subnet', () => {
    expect(makeIpRateLimitKey('2001:db8:1234:5678::1')).toBe(
      makeIpRateLimitKey('2001:db8:1234:5678::abcd')
    );
    expect(makeIpRateLimitKey('2001:db8:1234:5678::1')).not.toBe(
      makeIpRateLimitKey('2001:db8:1234:9999::1')
    );
  });

  it('uses a stable non-PII fallback for missing addresses', () => {
    expect(makeIpRateLimitKey(undefined)).toBe('ip:unknown');
  });
});

describe('makeHashedRateLimitKey', () => {
  it('uses a stable HMAC key without exposing the refresh token', () => {
    const token = 'private-refresh-token';
    const key = makeHashedRateLimitKey(
      'refresh-access-token',
      token,
      'test-secret'
    );

    expect(key).toMatch(/^hashed:refresh-access-token:[a-f0-9]{64}$/);
    expect(key).not.toContain(token);
  });

  it.each([undefined, null, 42, {}, [], '  '])(
    'falls back to the IP bucket for malformed input %#',
    (input) => {
      expect(
        makeHashedRateLimitKey('refresh-access-token', input, 'test-secret')
      ).toBeUndefined();
    }
  );

  it('returns undefined if createHmac throws', () => {
    expect(
      makeHashedRateLimitKey('refresh-access-token', 'token', 123 as any)
    ).toBeUndefined();
  });
});

describe('rateLimiter middleware instances', () => {
  const originalEnv = process.env.JWT_SECRET_KEY;

  beforeEach(() => {
    delete process.env.JWT_SECRET_KEY;
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (originalEnv !== undefined) {
      process.env.JWT_SECRET_KEY = originalEnv;
    } else {
      delete process.env.JWT_SECRET_KEY;
    }
  });

  it('handles loginWithEmail with valid email and fallback', async () => {
    const next = jest.fn();
    const reqWithEmail = {
      body: { email: 'user@example.com' },
      ip: '192.0.2.1',
      headers: {},
    } as any;
    const res = { setHeader: jest.fn() } as any;

    await rateLimiter.loginWithEmail(reqWithEmail, res, next);
    expect(next).toHaveBeenCalled();

    const reqWithoutEmail = {
      body: {},
      ip: '192.0.2.2',
      headers: {},
    } as any;
    await rateLimiter.loginWithEmail(reqWithoutEmail, res, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('handles verifyEmail', async () => {
    const next = jest.fn();
    const req = {
      body: { token: 'valid-token' },
      ip: '192.0.2.3',
      headers: {},
    } as any;
    const res = { setHeader: jest.fn() } as any;

    await rateLimiter.verifyEmail(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('handles getPasswordResetLink and getPasswordResetLinkByIp', async () => {
    const next = jest.fn();
    const req = {
      body: { email: 'reset@example.com' },
      ip: '192.0.2.4',
      headers: {},
    } as any;
    const res = { setHeader: jest.fn() } as any;

    await rateLimiter.getPasswordResetLink(req, res, next);
    expect(next).toHaveBeenCalled();

    await rateLimiter.getPasswordResetLinkByIp(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('handles resetPassword and resetPasswordByIp', async () => {
    const next = jest.fn();
    const req = {
      body: { token: 'password-reset-token' },
      ip: '192.0.2.5',
      headers: {},
    } as any;
    const res = { setHeader: jest.fn() } as any;

    await rateLimiter.resetPassword(req, res, next);
    expect(next).toHaveBeenCalled();

    await rateLimiter.resetPasswordByIp(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('handles refreshAccessToken with cookies and fallback', async () => {
    const next = jest.fn();
    const reqWithCookie = {
      cookies: { refresh_token: 'cookie-token' },
      ip: '192.0.2.6',
      headers: {},
    } as any;
    const res = { setHeader: jest.fn() } as any;

    await rateLimiter.refreshAccessToken(reqWithCookie, res, next);
    expect(next).toHaveBeenCalled();

    const reqWithoutCookie = {
      cookies: {},
      ip: '192.0.2.7',
      headers: {},
    } as any;
    await rateLimiter.refreshAccessToken(reqWithoutCookie, res, next);
    expect(next).toHaveBeenCalledTimes(2);
  });
});

describe('configureRateLimiter', () => {
  it('uses default IP keyGenerator when no custom keyGenerator is provided', async () => {
    const limiter = configureRateLimiter({
      windowMs: 60000,
      max: 5,
    });
    const next = jest.fn();
    const req = { ip: '192.0.2.10', headers: {} } as any;
    const res = { setHeader: jest.fn() } as any;

    await limiter(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('reports abuse on the first request exceeding the rate limit and passes TooManyRequests to next()', async () => {
    const limiter = configureRateLimiter({
      windowMs: 60000,
      max: 1,
    });

    const createReq = () =>
      ({
        method: 'POST',
        originalUrl: '/test-endpoint',
        ip: '192.0.2.20',
        headers: { 'user-agent': 'TestAgent' },
      }) as any;

    const res = { setHeader: jest.fn() } as any;
    const next1 = jest.fn();

    // First request passes
    await limiter(createReq(), res, next1);
    expect(next1).toHaveBeenCalledWith();

    // Second request (hits = 2, max = 1, used === limit + 1) -> reports abuse & calls next(appError.TooManyRequests)
    const next2 = jest.fn();
    await limiter(createReq(), res, next2);
    expect(reporter.reportAbuse).toHaveBeenCalledWith(
      'Too many requests to API',
      {
        method: 'POST',
        url: '/test-endpoint',
        ip: '192.0.2.20',
        userAgent: 'TestAgent',
      }
    );
    expect(next2).toHaveBeenCalledWith(expect.any(appError.TooManyRequests));

    // Third request (hits = 3, max = 1, used !== limit + 1) -> calls next(appError.TooManyRequests) without reporting abuse again
    jest.clearAllMocks();
    const next3 = jest.fn();
    await limiter(createReq(), res, next3);
    expect(reporter.reportAbuse).not.toHaveBeenCalled();
    expect(next3).toHaveBeenCalledWith(expect.any(appError.TooManyRequests));
  });
});
