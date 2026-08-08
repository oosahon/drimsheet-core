import { sanitizeData, sanitizeUrl } from '@shared/utils/sanitizer';

describe('sanitizer', () => {
  describe('sanitizeUrl', () => {
    it('redacts sensitive query parameters from URLs', () => {
      const url =
        'https://api.example.com/oauth/callback?code=secret123&state=xyz890&tenant=123';
      const sanitized = sanitizeUrl(url);
      expect(sanitized).toContain('code=%5BREDACTED%5D');
      expect(sanitized).toContain('state=%5BREDACTED%5D');
      expect(sanitized).toContain('tenant=123');
    });

    it('returns unmodified URL if no sensitive query parameters exist', () => {
      const url = '/api/v1/ledger?page=1&limit=20';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('handles invalid or empty strings gracefully', () => {
      expect(sanitizeUrl('')).toBe('');
      expect(sanitizeUrl(123 as unknown as string)).toBe(
        123 as unknown as string
      );
    });
    it('sanitizes plain text matching SENSITIVE_TEXT_REGEX without query parameters', () => {
      expect(sanitizeUrl('password=123')).toBe('password=[REDACTED]');
      expect(sanitizeUrl('token: abc')).toBe('token: [REDACTED]');
    });

    it('handles URLSearchParams construction error gracefully', () => {
      const spy = jest
        .spyOn(global, 'URLSearchParams')
        .mockImplementationOnce(() => {
          throw new Error('Mock search params error');
        });
      const url = 'https://example.com/api?token=123';
      // Should fall back to return the original match because of the error in URLSearchParams
      expect(sanitizeUrl(url)).toBe(url);
      spy.mockRestore();
    });
  });

  describe('sanitizeData', () => {
    it('returns null and undefined unchanged', () => {
      expect(sanitizeData(null)).toBeNull();
      expect(sanitizeData(undefined)).toBeUndefined();
    });

    it('returns primitive non-object types unchanged', () => {
      expect(sanitizeData(123)).toBe(123);
      expect(sanitizeData(true)).toBe(true);
    });

    it('returns Date and RegExp instances unchanged', () => {
      const date = new Date();
      const regex = /abc/g;
      expect(sanitizeData(date)).toBe(date);
      expect(sanitizeData(regex)).toBe(regex);
    });

    it('returns Buffer instances unchanged', () => {
      const buffer = Buffer.from('test');
      expect(sanitizeData(buffer)).toBe(buffer);
    });

    it('redacts sensitive keys in plain objects', () => {
      const input = {
        username: 'john_doe',
        password: 'SuperSecretPassword!',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        authorization: 'Bearer secret_token',
        nested: {
          secret: 'nested_secret_value',
          safeField: 'ok',
        },
      };

      const sanitized = sanitizeData(input) as Record<string, unknown>;

      expect(sanitized.username).toBe('john_doe');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.authorization).toBe('[REDACTED]');
      expect((sanitized.nested as Record<string, unknown>).secret).toBe(
        '[REDACTED]'
      );
      expect((sanitized.nested as Record<string, unknown>).safeField).toBe(
        'ok'
      );
    });

    it('redacts URLs inside object values', () => {
      const input = {
        redirectUrl:
          'https://app.example.com/callback?access_token=secret_abc123&scope=read',
      };

      const sanitized = sanitizeData(input) as Record<string, string>;
      expect(sanitized.redirectUrl).toContain('access_token=%5BREDACTED%5D');
      expect(sanitized.redirectUrl).toContain('scope=read');
    });

    it('handles arrays recursively', () => {
      const input = [
        { secret: 'hush' },
        { safe: 'data' },
        'https://example.com?refresh_token=123',
      ];

      const sanitized = sanitizeData(input) as unknown[];
      expect(sanitized[0]).toEqual({ secret: '[REDACTED]' });
      expect(sanitized[1]).toEqual({ safe: 'data' });
      expect(sanitized[2]).toContain('refresh_token=%5BREDACTED%5D');
    });

    it('safely handles circular object references', () => {
      const input: Record<string, unknown> = { name: 'test' };
      input.self = input;

      const sanitized = sanitizeData(input) as Record<string, unknown>;
      expect(sanitized.name).toBe('test');
      expect(sanitized.self).toBe('[CIRCULAR]');
    });

    it('sanitizes Error object instances and custom properties', () => {
      const err = new Error('Failed with URL: https://auth.com?code=12345');
      (err as unknown as Record<string, unknown>).secretKey = 'sensitive';
      (err as unknown as Record<string, unknown>).context = { token: 'abc' };

      const sanitized = sanitizeData(err) as Error & Record<string, unknown>;
      expect(sanitized.message).toContain('code=%5BREDACTED%5D');
      expect(sanitized.secretKey).toBe('[REDACTED]');
      expect(sanitized.context).toEqual({ token: '[REDACTED]' });
    });

    it('sanitizes Error object instances without stack trace', () => {
      const err = new Error('Failed with URL: https://auth.com?code=12345');
      delete err.stack;

      const sanitized = sanitizeData(err) as Error;
      expect(sanitized.message).toContain('code=%5BREDACTED%5D');
      expect(sanitized.stack).toBeUndefined();
    });
  });
});
