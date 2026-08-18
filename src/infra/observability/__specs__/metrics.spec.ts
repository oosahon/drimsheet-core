import { Meter } from '@opentelemetry/api';

import mockLogger from '@shared/contracts/__mocks__/logger.mock';

import {
  makeNoopObservabilityMetrics,
  makeOpenTelemetryMetrics,
} from '@infra/observability/metrics';

describe('observability metrics adapter', () => {
  const add = jest.fn();
  const recordHistogram = jest.fn();
  const recordGauge = jest.fn();
  const meter = {
    createCounter: jest.fn(() => ({ add })),
    createHistogram: jest.fn(() => ({ record: recordHistogram })),
    createGauge: jest.fn(() => ({ record: recordGauge })),
  } as unknown as Meter;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps counters, histograms, and gauges with metadata and attributes', () => {
    const metrics = makeOpenTelemetryMetrics(meter);

    metrics.increment({
      name: 'test.counter',
      description: 'Test counter',
      unit: '{operation}',
      value: 2,
      attributes: { outcome: 'success' },
    });
    metrics.observe({
      name: 'test.duration',
      description: 'Test duration',
      unit: 's',
      value: 0.25,
      attributes: { route: '/test' },
    });
    metrics.set({
      name: 'test.gauge',
      description: 'Test gauge',
      unit: '{item}',
      value: 3,
      attributes: { state: 'waiting' },
    });

    expect(meter.createCounter).toHaveBeenCalledWith('test.counter', {
      description: 'Test counter',
      unit: '{operation}',
    });
    expect(add).toHaveBeenCalledWith(2, { outcome: 'success' });
    expect(meter.createHistogram).toHaveBeenCalledWith('test.duration', {
      description: 'Test duration',
      unit: 's',
    });
    expect(recordHistogram).toHaveBeenCalledWith(0.25, { route: '/test' });
    expect(meter.createGauge).toHaveBeenCalledWith('test.gauge', {
      description: 'Test gauge',
      unit: '{item}',
    });
    expect(recordGauge).toHaveBeenCalledWith(3, { state: 'waiting' });
  });

  it('reuses instruments with the same stable name and unit', () => {
    const metrics = makeOpenTelemetryMetrics(meter);
    const input = {
      name: 'test.counter',
      description: 'Test counter',
      unit: '{operation}',
      value: 1,
      attributes: { outcome: 'success' },
    };

    metrics.increment(input);
    metrics.increment(input);

    expect(meter.createCounter).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledTimes(2);
  });

  it('contains provider failures and emits one bounded diagnostic', () => {
    const failure = new Error('provider unavailable');
    const failingMeter = {
      createCounter: jest.fn(() => ({
        add: jest.fn(() => {
          throw failure;
        }),
      })),
      createHistogram: jest.fn(() => ({
        record: jest.fn(() => {
          throw failure;
        }),
      })),
      createGauge: jest.fn(() => {
        throw failure;
      }),
    } as unknown as Meter;
    const metrics = makeOpenTelemetryMetrics(failingMeter, mockLogger);

    expect(() =>
      metrics.increment({
        name: 'test.counter',
        description: 'Test counter',
        unit: '{operation}',
        value: 1,
        attributes: {},
      })
    ).not.toThrow();
    expect(() =>
      metrics.observe({
        name: 'test.duration',
        description: 'Test duration',
        unit: 's',
        value: 1,
        attributes: {},
      })
    ).not.toThrow();
    expect(() =>
      metrics.set({
        name: 'test.gauge',
        description: 'Test gauge',
        unit: '{item}',
        value: 1,
        attributes: {},
      })
    ).not.toThrow();

    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'observability.metrics.recording_failed',
      expect.objectContaining({ operation: 'increment', outcome: 'failure' })
    );
  });

  it('provides a safe disabled adapter', () => {
    const metrics = makeNoopObservabilityMetrics();
    const input = {
      name: 'test.metric',
      description: 'Test metric',
      unit: '{operation}',
      value: 1,
      attributes: {},
    };

    expect(() => metrics.increment(input)).not.toThrow();
    expect(() => metrics.observe(input)).not.toThrow();
    expect(() => metrics.set(input)).not.toThrow();
    expect(Object.isFrozen(metrics)).toBe(true);
  });
});
