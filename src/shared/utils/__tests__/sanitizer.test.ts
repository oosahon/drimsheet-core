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

    it('falls back to plain-text redaction if URL parsing fails', () => {
      const spy = jest
        .spyOn(global, 'URLSearchParams')
        .mockImplementationOnce(() => {
          throw new Error('Mock search params error');
        });
      const url = 'https://example.com/api?token=123';
      expect(sanitizeUrl(url)).toBe('https://example.com/api?token=[REDACTED]');
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

      expect(sanitized.username).toBe('[REDACTED]');
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
      expect(sanitized.redirectUrl).toBe('[REDACTED]');
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
      expect(sanitized[2]).toBe('https://example.com?refresh_token=[REDACTED]');
    });

    it('safely handles circular object references', () => {
      const input: Record<string, unknown> = { status: 'test' };
      input.self = input;

      const sanitized = sanitizeData(input) as Record<string, unknown>;
      expect(sanitized.status).toBe('test');
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

    it('redacts email addresses in nested strings and Error fields', () => {
      const input = {
        message: 'Delivery failed for private.person@example.com',
        nested: ['Contact finance-team@example.co.uk for help'],
        error: new Error('Could not notify owner@example.com'),
      };

      const sanitized = sanitizeData(input) as {
        message: string;
        nested: string[];
        error: Error;
      };

      expect(sanitized.message).toBe('Delivery failed for [REDACTED]');
      expect(sanitized.nested).toEqual(['Contact [REDACTED] for help']);
      expect(sanitized.error.message).toBe('Could not notify [REDACTED]');
      expect(sanitized.error.stack).not.toContain('owner@example.com');
    });

    it('redacts prohibited personal, request, content, job, and financial fields', () => {
      const input = {
        id: 'product-id',
        emailAddress: 'private@example.com',
        backupRecipient: 'private@example.com',
        recipients: ['private@example.com'],
        userId: 'user-id',
        accounting_entity_id: 'entity-id',
        journalEntryId: 'journal-id',
        ledgerAccountId: 'account-id',
        jobId: 'job-id',
        ip: '192.0.2.1',
        userAgent: 'PrivateAgent',
        originalUrl: '/users/private-id?view=full',
        callbackUrl: '/oauth/callback?code=private',
        headers: { authorization: 'Bearer private' },
        cookies: { session: 'private' },
        request: { body: 'private' },
        subject: 'Private subject',
        html: '<p>Private message</p>',
        amount: 100,
        runningBalance: 200,
        functionalBalanceDelta: 50,
        job: { data: 'private' },
        payload: { value: 'private' },
      };

      const sanitized = sanitizeData(input) as Record<string, unknown>;

      Object.keys(input).forEach((key) => {
        expect(sanitized[key]).toBe('[REDACTED]');
      });
    });

    it('preserves bounded operational facts and contextual correlation', () => {
      const input = {
        event: 'queue.job.processing_failed',
        errorKey: 'app_error_unexpected',
        queue: 'transactional-email-queue',
        transport: 'bullmq',
        attempt: 2,
        method: 'POST',
        scope: 'login-with-email',
        signal: 'SIGTERM',
        source: 'worker',
        status: 'failed',
        outcome: 'failure',
        durationMs: 42,
        count: 1,
        currencyCode: 'USD',
        service: 'drimsheet-core',
        environment: 'test',
        version: '1.2.3',
        correlationId: 'correlation-id',
        traceId: 'trace-id',
        spanId: 'span-id',
      };

      expect(sanitizeData(input)).toEqual(input);
    });

    it('does not mutate the source value', () => {
      const input = {
        nested: {
          email: 'private@example.com',
          status: 'pending',
        },
      };

      const sanitized = sanitizeData(input) as typeof input;

      expect(sanitized).not.toBe(input);
      expect(sanitized.nested).not.toBe(input.nested);
      expect(input.nested.email).toBe('private@example.com');
      expect(sanitized.nested.email).toBe('[REDACTED]');
    });

    it('returns a safe marker when an object cannot be inspected', () => {
      const input = Object.defineProperty({}, 'blocked', {
        enumerable: true,
        get() {
          throw new Error('private@example.com');
        },
      });

      expect(sanitizeData(input)).toBe('[UNSERIALIZABLE]');
    });
  });
});
