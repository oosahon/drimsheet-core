import { Request, Response } from 'express';

import mockReporter from '@shared/contracts/__mocks__/reporter.mock';
import IVarsConfig from '@shared/contracts/vars-config.contract';
import appError from '@shared/values/errors/app.error';

import {
  AUTH_RATE_LIMITER_MESSAGE,
  configureRateLimiter,
  makeAccountRateLimitKey,
  makeAuthRateLimiters,
  makeHashedRateLimitKey,
  makeIpRateLimitKey,
  RATE_LIMITER_MESSAGE,
} from '@infra/config/rate-limiter.config';

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
  const varsConfig = {
    JWT_SECRET_KEY: 'test-rate-limit-secret',
  } as IVarsConfig;
  const rateLimiter = makeAuthRateLimiters(varsConfig, mockReporter);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles loginWithEmail with valid email and fallback', async () => {
    const next = jest.fn();
    const reqWithEmail = {
      body: { email: 'user@example.com' },
      ip: '192.0.2.1',
      headers: {},
    } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;

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

  it('uses the legacy fallback secret when JWT_SECRET_KEY is empty', async () => {
    const limiter = makeAuthRateLimiters(
      { ...varsConfig, JWT_SECRET_KEY: '' },
      mockReporter
    ).loginWithEmail;
    const email = 'fallback-secret@example.com';
    const req = {
      body: { email },
      ip: '192.0.2.8',
      headers: {},
    } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      await limiter(req, res, jest.fn());
    }

    await limiter.resetKey(
      makeAccountRateLimitKey('login-with-email', email, 'secret')!
    );

    const next = jest.fn();
    await limiter(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it.each([
    {
      limiter: 'loginWithEmail',
      scope: 'login-with-email',
      limit: 5,
      request: { body: { email: 'private@example.com' }, ip: '192.0.2.31' },
    },
    {
      limiter: 'verifyEmail',
      scope: 'verify-email',
      limit: 5,
      request: { body: { token: 'private-token' }, ip: '192.0.2.32' },
    },
    {
      limiter: 'getPasswordResetLink',
      scope: 'get-password-reset-link',
      limit: 5,
      request: { body: { email: 'private@example.com' }, ip: '192.0.2.33' },
    },
    {
      limiter: 'getPasswordResetLinkByIp',
      scope: 'get-password-reset-link-ip',
      limit: 20,
      request: { body: { email: 'private@example.com' }, ip: '192.0.2.34' },
    },
    {
      limiter: 'resetPassword',
      scope: 'reset-password',
      limit: 5,
      request: { body: { token: 'private-token' }, ip: '192.0.2.35' },
    },
    {
      limiter: 'resetPasswordByIp',
      scope: 'reset-password-ip',
      limit: 20,
      request: { body: { token: 'private-token' }, ip: '192.0.2.36' },
    },
    {
      limiter: 'refreshAccessToken',
      scope: 'refresh-access-token',
      limit: 10,
      request: {
        cookies: { refresh_token: 'private-refresh-token' },
        ip: '192.0.2.37',
      },
    },
  ] as const)(
    'reports bounded $scope facts without request identity',
    async ({ limiter, scope, limit, request }) => {
      const authRateLimiters = makeAuthRateLimiters(varsConfig, mockReporter);
      const rateLimitHandler = authRateLimiters[limiter];
      const req = {
        ...request,
        method: 'POST',
        originalUrl: '/private/path?email=private@example.com',
        headers: { 'user-agent': 'PrivateAgent' },
      } as unknown as Request;
      const res = { setHeader: jest.fn() } as unknown as Response;

      for (let attempt = 0; attempt <= limit; attempt += 1) {
        await rateLimitHandler(req, res, jest.fn());
      }

      expect(mockReporter.reportAbuse).toHaveBeenCalledTimes(1);
      expect(mockReporter.reportAbuse).toHaveBeenCalledWith(
        'Too many requests to API',
        {
          method: 'POST',
          scope,
          used: limit + 1,
          limit,
        }
      );
    }
  );
});

describe('configureRateLimiter', () => {
  it('uses default IP keyGenerator when no custom keyGenerator is provided', async () => {
    const limiter = configureRateLimiter(
      {
        scope: 'global',
        windowMs: 60000,
        max: 5,
      },
      mockReporter
    );
    const next = jest.fn();
    const req = { ip: '192.0.2.10', headers: {} } as any;
    const res = { setHeader: jest.fn() } as any;

    await limiter(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('reports abuse on the first request exceeding the rate limit and passes TooManyRequests to next()', async () => {
    const limiter = configureRateLimiter(
      {
        scope: 'global',
        windowMs: 60000,
        max: 1,
      },
      mockReporter
    );

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
    expect(mockReporter.reportAbuse).toHaveBeenCalledWith(
      'Too many requests to API',
      {
        method: 'POST',
        scope: 'global',
        used: 2,
        limit: 1,
      }
    );
    expect(next2).toHaveBeenCalledWith(expect.any(appError.TooManyRequests));

    // Third request (hits = 3, max = 1, used !== limit + 1) -> calls next(appError.TooManyRequests) without reporting abuse again
    jest.clearAllMocks();
    const next3 = jest.fn();
    await limiter(createReq(), res, next3);
    expect(mockReporter.reportAbuse).not.toHaveBeenCalled();
    expect(next3).toHaveBeenCalledWith(expect.any(appError.TooManyRequests));
  });
});
