import Sentry from '@sentry/node';
import logger from '../logger';
import reporter from '../reporter';

jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

describe('reporter', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('safely reports errors and context with sensitive data redacted', () => {
    const loggerErrorSpy = jest
      .spyOn(logger, 'error')
      .mockImplementation(() => {});

    class CustomDomainError extends Error {
      constructor(
        public readonly code: string,
        message: string
      ) {
        super(message);
        this.name = 'CustomDomainError';
      }
    }

    const err = new CustomDomainError(
      'INVALID_TOKEN',
      'Failed authentication with token: secret_abc123'
    );
    const context = {
      password: 'super-secret-pass',
      user: 'alice',
      url: '/api/v1/auth?access_token=token123',
    };

    reporter.report(err, context);

    expect(Sentry.captureException).toHaveBeenCalled();
    const sentryErr = (Sentry.captureException as jest.Mock).mock.calls[0][0];
    const sentryContext = (Sentry.captureException as jest.Mock).mock
      .calls[0][1];

    expect(sentryErr.message).toContain('token: [REDACTED]');
    expect(sentryErr.message).not.toContain('secret_abc123');

    expect(sentryContext.password).toBe('[REDACTED]');
    expect(sentryContext.user).toBe('alice');
    expect(sentryContext.url).toContain('access_token=%5BREDACTED%5D');
    expect(sentryContext.url).not.toContain('token123');

    expect(loggerErrorSpy).toHaveBeenCalled();
  });

  it('safely reports abuse messages and metadata', () => {
    const loggerWarnSpy = jest
      .spyOn(logger, 'warn')
      .mockImplementation(() => {});

    reporter.reportAbuse('Too many attempts with password: my-secret-pass', {
      ip: '127.0.0.1',
      api_key: 'key-12345',
    });

    expect(Sentry.captureMessage).toHaveBeenCalled();
    const sentryMsg = (Sentry.captureMessage as jest.Mock).mock.calls[0][0];
    const sentryMeta = (Sentry.captureMessage as jest.Mock).mock.calls[0][1];

    expect(sentryMsg).toContain('password: [REDACTED]');
    expect(sentryMsg).not.toContain('my-secret-pass');
    expect(sentryMeta.extra.api_key).toBe('[REDACTED]');
    expect(sentryMeta.extra.ip).toBe('127.0.0.1');

    expect(loggerWarnSpy).toHaveBeenCalled();
  });
});
