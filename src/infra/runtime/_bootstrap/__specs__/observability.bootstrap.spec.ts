import Sentry from '@sentry/node';

import { TRACING_CONFIG } from '@infra/config/observability-tracing.config';
import vars from '@infra/config/vars.config';
import scrubSentryEvent from '@infra/observability/helpers/scrub-sentry-event';
import scrubSentrySpan from '@infra/observability/helpers/scrub-sentry-span';
import scrubSentryTransaction from '@infra/observability/helpers/scrub-sentry-transaction';
import logger from '@infra/observability/logger';
import bootstrapObservability from '@infra/runtime/_bootstrap/observability.bootstrap';

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
}));

jest.mock('../../../observability/logger', () => ({
  __esModule: true,
  default: {
    warn: jest.fn(),
  },
}));

describe('bootstrapObservability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('configures Sentry privacy and tracing', () => {
    bootstrapObservability();

    expect(Sentry.init).toHaveBeenCalledWith({
      dsn: vars.SENTRY_DSN,
      environment: vars.APP_ENV,
      release: vars.APP_VERSION,
      sendDefaultPii: false,
      tracesSampleRate: TRACING_CONFIG.tracesSampleRate,
      tracePropagationTargets: [...TRACING_CONFIG.tracePropagationTargets],
      beforeSend: scrubSentryEvent,
      beforeSendSpan: scrubSentrySpan,
      beforeSendTransaction: scrubSentryTransaction,
    });
  });

  it('contains initialization failure', () => {
    const error = new Error('Sentry unavailable');
    jest.mocked(Sentry.init).mockImplementationOnce(() => {
      throw error;
    });

    expect(() => bootstrapObservability()).not.toThrow();
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

    expect(() => bootstrapObservability()).not.toThrow();
  });
});
