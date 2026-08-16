import Sentry from '@sentry/node';

import { ELogOutcome } from '@shared/types/observability.types';

import { TRACING_CONFIG } from '@infra/config/observability-tracing.config';
import vars from '@infra/config/vars.config';
import scrubSentryEvent from '@infra/observability/helpers/scrub-sentry-event';
import scrubSentrySpan from '@infra/observability/helpers/scrub-sentry-span';
import scrubSentryTransaction from '@infra/observability/helpers/scrub-sentry-transaction';
import logger from '@infra/observability/logger';

export default function bootstrapObservability(): void {
  try {
    Sentry.init({
      dsn: vars.SENTRY_DSN,
      sendDefaultPii: false,
      environment: vars.APP_ENV,
      release: vars.APP_VERSION,
      tracesSampleRate: TRACING_CONFIG.tracesSampleRate,
      tracePropagationTargets: [...TRACING_CONFIG.tracePropagationTargets],
      beforeSend: scrubSentryEvent,
      beforeSendSpan: scrubSentrySpan,
      beforeSendTransaction: scrubSentryTransaction,
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
