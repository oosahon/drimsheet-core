import Sentry from '@sentry/node';

import logger from '@infra/observability/logger';
import reporter from '@infra/observability/reporter';
import appContext from '@infra/runtime/app-context';

const originalAppEnv = process.env.APP_ENV;

jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

jest.mock('@infra/config/vars.config', () => ({
  __esModule: true,
  default: {
    get APP_ENV() {
      return process.env.APP_ENV || 'test';
    },
  },
}));

describe('reporter', () => {
  afterEach(() => {
    if (originalAppEnv === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = originalAppEnv;

    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('preserves the source event and safely reports error context', () => {
    const loggerErrorSpy = jest
      .spyOn(logger, 'error')
      .mockImplementation(() => undefined);
    const error = Object.assign(
      new Error('Failed authentication with token: secret_abc123'),
      { errorKey: 'auth_error_invalid_token' }
    );
    const context = {
      password: 'super-secret-pass',
      user: 'alice',
      url: '/api/v1/auth?access_token=token123',
    };

    appContext.init(
      { correlationId: 'report-correlation', idempotencyKey: '' },
      () =>
        reporter.report(
          'auth.password_reset.finalization_failed',
          error,
          context
        )
    );

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'auth.password_reset.finalization_failed',
      expect.objectContaining({
        password: '[REDACTED]',
        user: 'alice',
        error: expect.any(Error),
        errorKey: 'auth_error_invalid_token',
      })
    );

    const sentryError = jest.mocked(Sentry.captureException).mock.calls[0][0];
    const sentryContext = jest.mocked(Sentry.captureException).mock
      .calls[0][1] as { extra?: Record<string, unknown> } | undefined;
    const extra = sentryContext?.extra as Record<string, unknown>;

    expect((sentryError as Error).message).toContain('token: [REDACTED]');
    expect((sentryError as Error).message).not.toContain('secret_abc123');
    expect(extra.password).toBe('[REDACTED]');
    expect(extra.user).toBe('alice');
    expect(extra.url).toContain('access_token=%5BREDACTED%5D');
    expect(extra.url).not.toContain('token123');
    expect(extra.correlationId).toBe('report-correlation');
  });

  it('uses the canonical abuse event and sanitized metadata', () => {
    const loggerWarnSpy = jest
      .spyOn(logger, 'warn')
      .mockImplementation(() => undefined);

    reporter.reportAbuse('Too many attempts with password: my-secret-pass', {
      ip: '127.0.0.1',
      api_key: 'key-12345',
    });

    expect(loggerWarnSpy).toHaveBeenCalledWith('security.abuse.detected', {
      ip: '127.0.0.1',
      api_key: '[REDACTED]',
      message: 'Too many attempts with password: [REDACTED]',
    });

    const sentryMessage = jest.mocked(Sentry.captureMessage).mock.calls[0][0];
    const sentryContext = jest.mocked(Sentry.captureMessage).mock
      .calls[0][1] as { extra?: Record<string, unknown> } | undefined;
    const extra = sentryContext?.extra as Record<string, unknown>;

    expect(sentryMessage).not.toContain('my-secret-pass');
    expect(extra.api_key).toBe('[REDACTED]');
    expect(extra.ip).toBe('127.0.0.1');
  });

  it('handles an empty abuse message and missing runtime metadata', () => {
    const loggerWarnSpy = jest
      .spyOn(logger, 'warn')
      .mockImplementation(() => undefined);

    reporter.reportAbuse('', undefined as unknown as Record<string, unknown>);

    expect(loggerWarnSpy).toHaveBeenCalledWith('security.abuse.detected', {
      message: '',
    });
    expect(Sentry.captureMessage).toHaveBeenCalledWith('', {
      level: 'warning',
      extra: { correlationId: undefined },
    });
  });

  it('does not send abuse reports externally in the local environment', () => {
    const loggerWarnSpy = jest
      .spyOn(logger, 'warn')
      .mockImplementation(() => undefined);
    process.env.APP_ENV = 'local';

    reporter.reportAbuse('Request threshold exceeded', { ip: '127.0.0.1' });

    expect(loggerWarnSpy).toHaveBeenCalledWith('security.abuse.detected', {
      ip: '127.0.0.1',
      message: 'Request threshold exceeded',
    });
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('emits a non-recursive fallback event when external reporting fails', () => {
    const loggerErrorSpy = jest
      .spyOn(logger, 'error')
      .mockImplementation(() => undefined);
    jest.mocked(Sentry.captureException).mockImplementationOnce(() => {
      throw new Error('Sentry unavailable');
    });

    reporter.report('queue.job.processing_failed', new Error('job failed'));

    expect(loggerErrorSpy).toHaveBeenLastCalledWith(
      'observability.error.reporting_failed',
      expect.objectContaining({
        error: expect.any(Error),
        sourceEvent: 'queue.job.processing_failed',
      })
    );
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });

  it('uses the same non-recursive fallback when abuse reporting fails', () => {
    const loggerErrorSpy = jest
      .spyOn(logger, 'error')
      .mockImplementation(() => undefined);
    jest.mocked(Sentry.captureMessage).mockImplementationOnce(() => {
      throw new Error('Sentry unavailable');
    });

    reporter.reportAbuse('Request threshold exceeded', { ip: '127.0.0.1' });

    expect(loggerErrorSpy).toHaveBeenLastCalledWith(
      'observability.error.reporting_failed',
      expect.objectContaining({
        error: expect.any(Error),
        sourceEvent: 'security.abuse.detected',
      })
    );
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
  });
});
