import Sentry from '@sentry/node';

import { ELogOutcome } from '@shared/types/observability.types';

import vars from '@infra/config/vars.config';
import sentryScrubber from '@infra/integrations/sentry/sentry-scrubber';
import { SENTRY_CONFIG } from '@infra/integrations/sentry/sentry.config';
import logger from '@infra/observability/logger';

export default function bootstrapSentry(): void {
  try {
    Sentry.init({
      dsn: vars.SENTRY_DSN,
      sendDefaultPii: false,
      environment: vars.APP_ENV,
      release: vars.APP_VERSION,
      tracesSampleRate: SENTRY_CONFIG.tracesSampleRate,
      tracePropagationTargets: [...SENTRY_CONFIG.tracePropagationTargets],
      beforeSend: sentryScrubber.event,
      beforeSendSpan: sentryScrubber.span,
      beforeSendTransaction: sentryScrubber.transaction,
    });
  } catch (error) {
    try {
      logger.warn('observability.sentry.initialization_failed', {
        outcome: ELogOutcome.Failure,
        error,
      });
    } catch {
      // Observability initialization must never prevent application startup.
    }
  }
}
