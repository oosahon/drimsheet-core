import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';

import mockLogger from '@shared/contracts/__mocks__/logger.mock';
import { IObservabilityMetricsConfig } from '@shared/types/observability.types';

import runtimeVars from '@infra/config/vars.config';
import makeMetricsRuntime from '@infra/runtime/observability-runtime';

const mockMeter = {
  createCounter: jest.fn(() => ({ add: jest.fn() })),
  createHistogram: jest.fn(() => ({ record: jest.fn() })),
  createGauge: jest.fn(() => ({ record: jest.fn() })),
};
const mockProviderShutdown = jest.fn();
const mockProviderGetMeter = jest.fn(() => mockMeter);
const mockResource = { resource: 'test-resource' };

jest.mock('@opentelemetry/exporter-metrics-otlp-http', () => ({
  OTLPMetricExporter: jest.fn(),
}));

jest.mock('@opentelemetry/resources', () => ({
  resourceFromAttributes: jest.fn(() => mockResource),
}));

jest.mock('@opentelemetry/sdk-metrics', () => ({
  AggregationType: { EXPONENTIAL_HISTOGRAM: 'exponential-histogram' },
  InstrumentType: { HISTOGRAM: 'histogram' },
  MeterProvider: jest.fn(() => ({
    getMeter: mockProviderGetMeter,
    shutdown: mockProviderShutdown,
  })),
  PeriodicExportingMetricReader: jest.fn(),
}));

jest.mock('../../config/vars.config', () => ({
  __esModule: true,
  default: {
    APP_ENV: 'test',
    APP_INSTANCE_ID: 'test-instance',
  },
}));

function makeConfig(
  overrides: Partial<IObservabilityMetricsConfig> = {}
): IObservabilityMetricsConfig {
  return {
    enabled: true,
    exportIntervalMs: 60_000,
    otlpHttpEndpoint: 'http://grafana-alloy:4318/v1/metrics',
    shutdownTimeoutMs: 5_000,
    bullMQMetricsPort: 0,
    ...overrides,
  };
}

describe('observability runtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProviderShutdown.mockResolvedValue(undefined);
    runtimeVars.APP_ENV = 'test';
    runtimeVars.APP_INSTANCE_ID = 'test-instance';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('stays inert when metrics are disabled', async () => {
    const runtime = makeMetricsRuntime(
      makeConfig({ enabled: false }),
      mockLogger
    );

    await runtime.shutdown();

    expect(OTLPMetricExporter).not.toHaveBeenCalled();
    expect(MeterProvider).not.toHaveBeenCalled();
  });

  it('rejects enabled configuration without an internal endpoint safely', () => {
    const runtime = makeMetricsRuntime(
      makeConfig({ otlpHttpEndpoint: '' }),
      mockLogger
    );

    runtime.metrics.increment({
      name: 'test.counter',
      description: 'Test counter',
      unit: '{operation}',
      value: 1,
      attributes: {},
    });

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'observability.metrics.configuration_invalid',
      {
        field: 'METRICS_OTLP_HTTP_ENDPOINT',
        outcome: 'failure',
      }
    );
    expect(OTLPMetricExporter).not.toHaveBeenCalled();
  });

  it('contains fallback logger failures during metrics setup', () => {
    mockLogger.warn.mockImplementationOnce(() => {
      throw new Error('logger unavailable');
    });

    expect(() =>
      makeMetricsRuntime(makeConfig({ otlpHttpEndpoint: '' }), mockLogger)
    ).not.toThrow();
  });

  it('configures OTLP/HTTP periodic export and exponential histograms', () => {
    const runtime = makeMetricsRuntime(makeConfig(), mockLogger);

    expect(OTLPMetricExporter).toHaveBeenCalledWith({
      url: 'http://grafana-alloy:4318/v1/metrics',
      concurrencyLimit: 1,
    });
    expect(PeriodicExportingMetricReader).toHaveBeenCalledWith({
      exporter: expect.any(Object),
      exportIntervalMillis: 60_000,
      exportTimeoutMillis: 5_000,
      cardinalityLimits: {
        counter: 100,
        gauge: 100,
        histogram: 100,
        default: 100,
      },
    });
    expect(MeterProvider).toHaveBeenCalledWith({
      resource: mockResource,
      readers: [expect.any(Object)],
      views: [
        {
          instrumentType: 'histogram',
          aggregation: { type: 'exponential-histogram' },
          aggregationCardinalityLimit: 100,
        },
      ],
    });
    expect(mockProviderGetMeter).toHaveBeenCalledWith(
      'drimsheet-core',
      expect.any(String)
    );
    expect(resourceFromAttributes).toHaveBeenCalledWith({
      'service.name': 'drimsheet-core',
      'service.version': '0.1.0-alpha.1',
      'deployment.environment.name': 'test',
      'service.instance.id': 'test-instance',
    });
    expect(Object.isFrozen(runtime)).toBe(true);
  });

  it('replaces unsafe resource identity with bounded fallbacks', () => {
    runtimeVars.APP_ENV = 'production';
    runtimeVars.APP_INSTANCE_ID = 'private.person@example.com';

    makeMetricsRuntime(makeConfig(), mockLogger);

    expect(resourceFromAttributes).toHaveBeenCalledWith({
      'service.name': 'drimsheet-core',
      'service.version': '0.1.0-alpha.1',
      'deployment.environment.name': 'production',
      'service.instance.id': 'unknown',
    });
  });

  it('shuts down once with the configured bound', async () => {
    const runtime = makeMetricsRuntime(makeConfig(), mockLogger);

    await runtime.shutdown();
    await runtime.shutdown();

    expect(mockProviderShutdown).toHaveBeenCalledTimes(1);
    expect(mockProviderShutdown).toHaveBeenCalledWith({
      timeoutMillis: 5_000,
    });
  });

  it('contains initialization and shutdown failures', async () => {
    jest.mocked(OTLPMetricExporter).mockImplementationOnce(() => {
      throw new Error('initialization failed');
    });

    expect(() => makeMetricsRuntime(makeConfig(), mockLogger)).not.toThrow();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'observability.metrics.initialization_failed',
      expect.objectContaining({ outcome: 'failure' })
    );

    jest.clearAllMocks();
    mockProviderShutdown.mockRejectedValueOnce(new Error('shutdown failed'));
    const runtime = makeMetricsRuntime(makeConfig(), mockLogger);

    await expect(runtime.shutdown()).resolves.toBeUndefined();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'observability.metrics.shutdown_failed',
      expect.objectContaining({ outcome: 'failure' })
    );
  });
});
