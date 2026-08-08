import { sanitizeData } from '@shared/utils/sanitizer';

import logger from '@infra/observability/logger';

describe('logger', () => {
  it('provides a functional ILogger interface', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('redacts sensitive URLs and object metadata through sanitization', () => {
    const rawUrl = '[200] GET /api/auth?token=secret123&state=xyz';
    const rawMeta = {
      password: 'my-password',
      token: 'jwt-token',
      safe: 'val',
    };

    const sanitizedUrl = sanitizeData(rawUrl);
    const sanitizedMeta = sanitizeData(rawMeta) as Record<string, unknown>;

    expect(sanitizedUrl).toContain('token=%5BREDACTED%5D');
    expect(sanitizedUrl).toContain('state=%5BREDACTED%5D');
    expect(sanitizedUrl).not.toContain('secret123');

    expect(sanitizedMeta.password).toBe('[REDACTED]');
    expect(sanitizedMeta.token).toBe('[REDACTED]');
    expect(sanitizedMeta.safe).toBe('val');
  });
});
