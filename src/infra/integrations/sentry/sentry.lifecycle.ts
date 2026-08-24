import Sentry from '@sentry/node';

import { ELogOutcome } from '@shared/types/observability.types';

import { SENTRY_CONFIG } from '@infra/integrations/sentry/sentry.config';
import logger from '@infra/observability/logger';

type TShutdownSignal = 'SIGINT' | 'SIGTERM';

function warnSafely(event: string, fields: Record<string, unknown>) {
  try {
    logger.warn(event, fields);
  } catch {
    // Sentry shutdown must never affect the process lifecycle.
  }
}

async function shutdown(signal?: TShutdownSignal): Promise<void> {
  try {
    const flushed = await Sentry.flush(SENTRY_CONFIG.flushTimeoutMs);

    if (!flushed) {
      warnSafely('observability.sentry.flush_failed', {
        outcome: ELogOutcome.Failure,
        ...(signal ? { signal } : {}),
      });
    }
  } catch (error) {
    warnSafely('observability.sentry.flush_failed', {
      outcome: ELogOutcome.Failure,
      error,
      ...(signal ? { signal } : {}),
    });
  }
}

const sentryLifecycle = Object.freeze({ shutdown });

export default sentryLifecycle;
