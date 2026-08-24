import Sentry from '@sentry/node';

import vars from '@infra/config/vars.config';
import sentryScrubber from '@infra/integrations/sentry/sentry-scrubber';
import bootstrapSentry from '@infra/integrations/sentry/sentry.bootstrap';
import { SENTRY_CONFIG } from '@infra/integrations/sentry/sentry.config';
import logger from '@infra/observability/logger';

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
}));

jest.mock('@infra/observability/logger', () => ({
  __esModule: true,
  default: {
    warn: jest.fn(),
  },
}));

describe('bootstrapSentry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('configures Sentry privacy and tracing', () => {
    bootstrapSentry();

    expect(Sentry.init).toHaveBeenCalledWith({
      dsn: vars.SENTRY_DSN,
      environment: vars.APP_ENV,
      release: vars.APP_VERSION,
      sendDefaultPii: false,
      tracesSampleRate: SENTRY_CONFIG.tracesSampleRate,
      tracePropagationTargets: [...SENTRY_CONFIG.tracePropagationTargets],
      beforeSend: sentryScrubber.event,
      beforeSendSpan: sentryScrubber.span,
      beforeSendTransaction: sentryScrubber.transaction,
    });
  });

  it('contains initialization failure', () => {
    const error = new Error('Sentry unavailable');
    jest.mocked(Sentry.init).mockImplementationOnce(() => {
      throw error;
    });

    expect(() => bootstrapSentry()).not.toThrow();
    expect(logger.warn).toHaveBeenCalledWith(
      'observability.sentry.initialization_failed',
      { error, outcome: 'failure' }
    );
  });

  it('contains fallback logger failure during initialization', () => {
    jest.mocked(Sentry.init).mockImplementationOnce(() => {
      throw new Error('Sentry unavailable');
    });
    jest.mocked(logger.warn).mockImplementationOnce(() => {
      throw new Error('logger unavailable');
    });

    expect(() => bootstrapSentry()).not.toThrow();
  });
});
