import Sentry from '@sentry/node';

import { ELogOutcome } from '@shared/types/observability.types';

import { TRACING_CONFIG } from '@infra/config/observability-tracing.config';
import { metricsRuntime } from '@infra/observability';
import logger from '@infra/observability/logger';

type TShutdownSignal = 'SIGINT' | 'SIGTERM';

let shutdownPromise: Promise<void> | undefined;

function warnSafely(event: string, fields: Record<string, unknown>) {
  try {
    logger.warn(event, fields);
  } catch {
    // Telemetry shutdown must never affect the process lifecycle.
  }
}

async function flushSentrySafely(signal?: TShutdownSignal) {
  try {
    const flushed = await Sentry.flush(TRACING_CONFIG.flushTimeoutMs);

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

async function shutdownMetricsSafely(signal?: TShutdownSignal) {
  try {
    await metricsRuntime.shutdown();
  } catch (error) {
    warnSafely('observability.lifecycle.shutdown_failed', {
      outcome: ELogOutcome.Failure,
      error,
      ...(signal ? { signal } : {}),
    });
  }
}

function shutdown(signal?: TShutdownSignal): Promise<void> {
  shutdownPromise ??= Promise.all([
    flushSentrySafely(signal),
    shutdownMetricsSafely(signal),
  ]).then(() => undefined);

  return shutdownPromise;
}

const observabilityLifecycle = Object.freeze({ shutdown });

export default observabilityLifecycle;
