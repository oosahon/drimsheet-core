import Sentry from '@sentry/node';

import mockLogger from '@shared/contracts/__mocks__/logger.mock';

import sentryLifecycle from '@infra/integrations/sentry/sentry.lifecycle';

jest.mock('@sentry/node', () => ({
  flush: jest.fn(),
}));

jest.mock('@infra/integrations/sentry/sentry.config', () => ({
  SENTRY_CONFIG: {
    flushTimeoutMs: 4_000,
  },
}));

jest.mock('@infra/observability/logger', () => ({
  __esModule: true,
  default: mockLogger,
}));

describe('Sentry lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(Sentry.flush).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('performs a bounded flush', async () => {
    await sentryLifecycle.shutdown('SIGTERM');

    expect(Sentry.flush).toHaveBeenCalledWith(4_000);
    expect(mockLogger.warn).not.toHaveBeenCalled();
    expect(Object.isFrozen(sentryLifecycle)).toBe(true);
  });

  it('warns when Sentry cannot flush within the bound', async () => {
    jest.mocked(Sentry.flush).mockResolvedValue(false);

    await sentryLifecycle.shutdown('SIGTERM');

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'observability.sentry.flush_failed',
      { outcome: 'failure', signal: 'SIGTERM' }
    );
  });

  it('contains Sentry flush and logger failures', async () => {
    const error = new Error('flush unavailable');
    jest.mocked(Sentry.flush).mockRejectedValue(error);
    mockLogger.warn.mockImplementationOnce(() => {
      throw new Error('logger unavailable');
    });

    await expect(sentryLifecycle.shutdown()).resolves.toBeUndefined();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'observability.sentry.flush_failed',
      { error, outcome: 'failure' }
    );
  });

  it('includes the shutdown signal when a flush rejects', async () => {
    const error = new Error('flush unavailable');
    jest.mocked(Sentry.flush).mockRejectedValue(error);

    await expect(sentryLifecycle.shutdown('SIGINT')).resolves.toBeUndefined();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'observability.sentry.flush_failed',
      { error, outcome: 'failure', signal: 'SIGINT' }
    );
  });
});
