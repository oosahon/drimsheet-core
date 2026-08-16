import IVarsConfig from '@shared/contracts/vars-config.contract';
import { IObservabilityMetricsConfig } from '@shared/types/observability.types';

import vars from './vars.config';

const EXPORT_INTERVAL_MS = 60_000;
const SHUTDOWN_TIMEOUT_MS = 5_000;

export function makeObservabilityMetricsConfig(
  varsConfig: IVarsConfig
): IObservabilityMetricsConfig {
  return {
    enabled: varsConfig.METRICS_ENABLED.toLowerCase() === 'true',
    exportIntervalMs: EXPORT_INTERVAL_MS,
    otlpHttpEndpoint: varsConfig.METRICS_OTLP_HTTP_ENDPOINT,
    shutdownTimeoutMs: SHUTDOWN_TIMEOUT_MS,
    bullMQMetricsPort: Number(varsConfig.BULLMQ_METRICS_PORT) || 0,
  };
}

export const METRICS_CONFIG = makeObservabilityMetricsConfig(vars);
