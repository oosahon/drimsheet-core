import Sentry from '@sentry/node';

import vars from '@infra/config/vars.config';
import { metricsRuntime } from '@infra/observability';

export default function bootstrapObservability(): void {
  Sentry.init({
    dsn: vars.SENTRY_DSN,
    sendDefaultPii: true,
    environment: vars.APP_ENV,
    release: vars.APP_VERSION,
  });

  metricsRuntime.registerShutdown();
}
