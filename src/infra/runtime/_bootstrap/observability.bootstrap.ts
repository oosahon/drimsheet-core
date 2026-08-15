import Sentry from '@sentry/node';

import vars from '@infra/config/vars.config';
import { metricsRuntime } from '@infra/observability';
import scrubSentryEvent from '@infra/observability/helpers/scrub-sentry-event';

export default function bootstrapObservability(): void {
  Sentry.init({
    dsn: vars.SENTRY_DSN,
    sendDefaultPii: false,
    environment: vars.APP_ENV,
    release: vars.APP_VERSION,
    beforeSend: scrubSentryEvent,
  });

  metricsRuntime.registerShutdown();
}
