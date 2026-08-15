import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import {
  AggregationType,
  InstrumentType,
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';

import ILogger from '@shared/contracts/logger.contract';
import IObservabilityMetrics from '@shared/contracts/observability-metrics.contract';
import {
  ELogOutcome,
  ILogFields,
  IObservabilityMetricsConfig,
} from '@shared/types/observability.types';

import {
  makeNoopObservabilityMetrics,
  makeOpenTelemetryMetrics,
} from '@infra/observability/metrics';

import packageJson from '../../../package.json';

interface IMetricsRuntime {
  metrics: IObservabilityMetrics;
  registerShutdown(): void;
  shutdown(): Promise<void>;
}

const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM'] as const;
const MAX_INSTRUMENT_CARDINALITY = 100;

function warnSafely(logger: ILogger, event: string, fields: ILogFields) {
  try {
    logger.warn(event, fields);
  } catch {
    // Observability initialization and shutdown must never affect callers.
  }
}

function makeDisabledRuntime(): IMetricsRuntime {
  return Object.freeze({
    metrics: makeNoopObservabilityMetrics(),
    registerShutdown: () => undefined,
    shutdown: async () => undefined,
  });
}

export default function makeMetricsRuntime(
  config: IObservabilityMetricsConfig,
  logger: ILogger
): IMetricsRuntime {
  if (!config.enabled) return makeDisabledRuntime();

  if (!config.otlpHttpEndpoint) {
    warnSafely(logger, 'observability.metrics.configuration_invalid', {
      field: 'METRICS_OTLP_HTTP_ENDPOINT',
      outcome: ELogOutcome.Failure,
    });

    return makeDisabledRuntime();
  }

  try {
    const exporter = new OTLPMetricExporter({
      url: config.otlpHttpEndpoint,
      concurrencyLimit: 1,
    });
    const reader = new PeriodicExportingMetricReader({
      exporter,
      exportIntervalMillis: config.exportIntervalMs,
      exportTimeoutMillis: Math.min(
        config.exportIntervalMs,
        config.shutdownTimeoutMs
      ),
      cardinalityLimits: {
        counter: MAX_INSTRUMENT_CARDINALITY,
        gauge: MAX_INSTRUMENT_CARDINALITY,
        histogram: MAX_INSTRUMENT_CARDINALITY,
        default: MAX_INSTRUMENT_CARDINALITY,
      },
    });
    const provider = new MeterProvider({
      readers: [reader],
      views: [
        {
          instrumentType: InstrumentType.HISTOGRAM,
          aggregation: {
            type: AggregationType.EXPONENTIAL_HISTOGRAM,
          },
          aggregationCardinalityLimit: MAX_INSTRUMENT_CARDINALITY,
        },
      ],
    });
    const meter = provider.getMeter(packageJson.name, packageJson.version);
    const metrics = makeOpenTelemetryMetrics(meter, logger);
    let shutdownRegistered = false;
    let shutdownStarted = false;

    async function shutdown() {
      if (shutdownStarted) return;
      shutdownStarted = true;

      try {
        await provider.shutdown({
          timeoutMillis: config.shutdownTimeoutMs,
        });
      } catch (error) {
        warnSafely(logger, 'observability.metrics.shutdown_failed', {
          outcome: ELogOutcome.Failure,
          error,
        });
      }
    }

    function registerShutdown() {
      if (shutdownRegistered) return;
      shutdownRegistered = true;

      SHUTDOWN_SIGNALS.forEach((signal) => {
        process.once(signal, async () => shutdown());
      });
    }

    return Object.freeze({ metrics, registerShutdown, shutdown });
  } catch (error) {
    warnSafely(logger, 'observability.metrics.initialization_failed', {
      outcome: ELogOutcome.Failure,
      error,
    });

    return makeDisabledRuntime();
  }
}
