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

  it('normalizes supported settings and keeps internal timing bounds fixed', () => {
    const config = makeObservabilityMetricsConfig(
      makeVarsConfig({
        METRICS_ENABLED: 'TRUE',
        METRICS_OTLP_HTTP_ENDPOINT: 'http://grafana-alloy:4318/v1/metrics',
        BULLMQ_METRICS_PORT: '9464',
      })
    );

    expect(config).toEqual({
      enabled: true,
      exportIntervalMs: 60_000,
      otlpHttpEndpoint: 'http://grafana-alloy:4318/v1/metrics',
      shutdownTimeoutMs: 5_000,
      bullMQMetricsPort: 9_464,
    });
  });

  it('disables the internal scrape listener for an invalid port', () => {
    const config = makeObservabilityMetricsConfig(
      makeVarsConfig({
        BULLMQ_METRICS_PORT: '',
      })
    );

    expect(config.bullMQMetricsPort).toBe(0);
  });
});
