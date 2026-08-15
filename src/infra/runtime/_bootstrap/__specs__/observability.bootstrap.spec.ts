import Sentry from '@sentry/node';

import vars from '@infra/config/vars.config';
import { metricsRuntime } from '@infra/observability';
import scrubSentryEvent from '@infra/observability/helpers/scrub-sentry-event';
import bootstrapObservability from '@infra/runtime/_bootstrap/observability.bootstrap';

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
}));

jest.mock('../../../observability', () => ({
  metricsRuntime: {
    registerShutdown: jest.fn(),
  },
}));

describe('bootstrapObservability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('configures Sentry and registers metrics shutdown handling', () => {
    bootstrapObservability();

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: vars.APP_ENV,
        release: vars.APP_VERSION,
        sendDefaultPii: false,
        beforeSend: scrubSentryEvent,
      })
    );
    expect(metricsRuntime.registerShutdown).toHaveBeenCalledTimes(1);
  });
});
