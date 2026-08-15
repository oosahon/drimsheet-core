import Sentry from '@sentry/node';

import vars from '@infra/config/vars.config';

export default function setupObservability(): void {
  Sentry.init({
    dsn: vars.SENTRY_DSN,
    sendDefaultPii: true,
    environment: vars.APP_ENV,
    release: vars.APP_VERSION,
  });
}
