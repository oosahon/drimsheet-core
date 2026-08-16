import { IObservabilityTracingConfig } from '@shared/types/observability.types';

import vars from './vars.config';

const DEFAULT_FLUSH_TIMEOUT_MS = 5_000;
const MAX_FLUSH_TIMEOUT_MS = 30_000;

function getSampleRate() {
  const sampleRate = Number(vars.SENTRY_TRACES_SAMPLE_RATE);

  return Number.isFinite(sampleRate) && sampleRate >= 0 && sampleRate <= 1
    ? sampleRate
    : 0;
}

function getFlushTimeout() {
  const timeout = Number(vars.SENTRY_FLUSH_TIMEOUT_MS);

  if (!Number.isFinite(timeout) || timeout <= 0) {
    return DEFAULT_FLUSH_TIMEOUT_MS;
  }

  return Math.min(timeout, MAX_FLUSH_TIMEOUT_MS);
}

function getTracePropagationTargets() {
  const targets = vars.SENTRY_TRACE_PROPAGATION_TARGETS.split(',').flatMap(
    (candidate) => {
      try {
        return [new URL(candidate.trim()).origin];
      } catch {
        return [];
      }
    }
  );

  return Object.freeze([...new Set(targets)]);
}

function makeObservabilityTracingConfig(): IObservabilityTracingConfig {
  return Object.freeze({
    flushTimeoutMs: getFlushTimeout(),
    tracePropagationTargets: getTracePropagationTargets(),
    tracesSampleRate: getSampleRate(),
  });
}

export const TRACING_CONFIG = makeObservabilityTracingConfig();
