import IVarsConfig from '@shared/contracts/vars-config.contract';

import {
  makeObservabilityMetricsConfig,
  METRICS_CONFIG,
} from '@infra/config/observability-metrics.config';
import vars from '@infra/config/vars.config';

function makeVarsConfig(overrides: Partial<IVarsConfig> = {}): IVarsConfig {
  return { ...vars, ...overrides };
}

describe('metrics config', () => {
  it('keeps export and the internal scrape listener disabled by default', () => {
    expect(METRICS_CONFIG).toEqual({
      enabled: false,
      exportIntervalMs: 60_000,
      otlpHttpEndpoint: '',
      shutdownTimeoutMs: 5_000,
      bullMQMetricsPort: 0,
    });
  });

  it('normalizes configured environment values', () => {
    const config = makeObservabilityMetricsConfig(
      makeVarsConfig({
        METRICS_ENABLED: 'TRUE',
        METRICS_EXPORT_INTERVAL_MS: '30000',
        METRICS_OTLP_HTTP_ENDPOINT: 'http://grafana-alloy:4318/v1/metrics',
        METRICS_SHUTDOWN_TIMEOUT_MS: '2500',
        BULLMQ_METRICS_PORT: '9464',
      })
    );

    expect(config).toEqual({
      enabled: true,
      exportIntervalMs: 30_000,
      otlpHttpEndpoint: 'http://grafana-alloy:4318/v1/metrics',
      shutdownTimeoutMs: 2_500,
      bullMQMetricsPort: 9_464,
    });
  });

  it('uses safe defaults for invalid numeric values', () => {
    const config = makeObservabilityMetricsConfig(
      makeVarsConfig({
        METRICS_EXPORT_INTERVAL_MS: '-1',
        METRICS_SHUTDOWN_TIMEOUT_MS: 'invalid',
        BULLMQ_METRICS_PORT: '',
      })
    );

    expect(config.exportIntervalMs).toBe(60_000);
    expect(config.shutdownTimeoutMs).toBe(5_000);
    expect(config.bullMQMetricsPort).toBe(0);
  });
});
