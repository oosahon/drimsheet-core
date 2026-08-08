import Sentry from '@sentry/node';

import { NODE_ENV, SENTRY_DSN } from '@infra/config/vars.config';

export default function setupObservability(): void {
  Sentry.init({
    dsn: SENTRY_DSN,
    sendDefaultPii: true,
    environment: NODE_ENV,
  });
}
