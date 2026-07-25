import {
  makeAccountRateLimitKey,
  makeIpRateLimitKey,
} from '../rate-limiter.config';

jest.mock('../../observability/reporter', () => ({
  __esModule: true,
  default: {
    reportAbuse: jest.fn(),
  },
}));

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
