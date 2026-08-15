import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';

import mockLogger from '@shared/contracts/__mocks__/logger.mock';
import { IObservabilityMetricsConfig } from '@shared/types/observability.types';

import makeMetricsRuntime from '@infra/runtime/observability-runtime';

const mockMeter = {
  createCounter: jest.fn(() => ({ add: jest.fn() })),
  createHistogram: jest.fn(() => ({ record: jest.fn() })),
  createGauge: jest.fn(() => ({ record: jest.fn() })),
};
const mockProviderShutdown = jest.fn();
const mockProviderGetMeter = jest.fn(() => mockMeter);

jest.mock('@opentelemetry/exporter-metrics-otlp-http', () => ({
  OTLPMetricExporter: jest.fn(),
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
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('stays inert when metrics are disabled', async () => {
    const processOnce = jest.spyOn(process, 'once');
    const runtime = makeMetricsRuntime(
      makeConfig({ enabled: false }),
      mockLogger
    );

    runtime.registerShutdown();
    await runtime.shutdown();

    expect(OTLPMetricExporter).not.toHaveBeenCalled();
    expect(MeterProvider).not.toHaveBeenCalled();
    expect(processOnce).not.toHaveBeenCalled();
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
    expect(Object.isFrozen(runtime)).toBe(true);
  });

  it('registers shutdown once and flushes with the configured bound', async () => {
    const handlers = new Map<string, () => Promise<void>>();
    jest.spyOn(process, 'once').mockImplementation((signal, listener) => {
      if (signal === 'SIGINT' || signal === 'SIGTERM') {
        handlers.set(signal, async () => listener(signal));
      }

      return process;
    });
    const runtime = makeMetricsRuntime(makeConfig(), mockLogger);

    runtime.registerShutdown();
    runtime.registerShutdown();
    await handlers.get('SIGTERM')?.();
    await runtime.shutdown();

    expect(process.once).toHaveBeenCalledTimes(2);
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
