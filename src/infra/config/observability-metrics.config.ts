import IVarsConfig from '@shared/contracts/vars-config.contract';
import { IObservabilityMetricsConfig } from '@shared/types/observability.types';

import vars from './vars.config';

const DEFAULT_EXPORT_INTERVAL_MS = 60_000;
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 5_000;

function getPositiveNumber(value: string | undefined, fallback: number) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

export function makeObservabilityMetricsConfig(
  varsConfig: IVarsConfig
): IObservabilityMetricsConfig {
  return {
    enabled: varsConfig.METRICS_ENABLED.toLowerCase() === 'true',
    exportIntervalMs: getPositiveNumber(
      varsConfig.METRICS_EXPORT_INTERVAL_MS,
      DEFAULT_EXPORT_INTERVAL_MS
    ),
    otlpHttpEndpoint: varsConfig.METRICS_OTLP_HTTP_ENDPOINT,
    shutdownTimeoutMs: getPositiveNumber(
      varsConfig.METRICS_SHUTDOWN_TIMEOUT_MS,
      DEFAULT_SHUTDOWN_TIMEOUT_MS
    ),
    bullMQMetricsPort: Number(varsConfig.BULLMQ_METRICS_PORT) || 0,
  };
}

export const METRICS_CONFIG = makeObservabilityMetricsConfig(vars);
