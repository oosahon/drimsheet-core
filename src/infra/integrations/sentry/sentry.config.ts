import { IObservabilityTracingConfig } from '@shared/types/observability.types';

import vars from '@infra/config/vars.config';

const FLUSH_TIMEOUT_MS = 5_000;
const TRACE_PROPAGATION_TARGETS: readonly string[] = Object.freeze([]);

function getSampleRate() {
  const sampleRate = Number(vars.SENTRY_TRACES_SAMPLE_RATE);

  return Number.isFinite(sampleRate) && sampleRate >= 0 && sampleRate <= 1
    ? sampleRate
    : 0;
}

function makeObservabilityTracingConfig(): IObservabilityTracingConfig {
  return Object.freeze({
    flushTimeoutMs: FLUSH_TIMEOUT_MS,
    tracePropagationTargets: TRACE_PROPAGATION_TARGETS,
    tracesSampleRate: getSampleRate(),
  });
}

export const SENTRY_CONFIG = makeObservabilityTracingConfig();
