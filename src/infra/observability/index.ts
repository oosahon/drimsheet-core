import { METRICS_CONFIG } from '@infra/config/observability-metrics.config';
import makeMetricsRuntime from '@infra/runtime/observability-runtime';

import makeHttpMetrics from './http-metrics';
import logger from './logger';
import makeQueueMetrics from './queue-metrics';
import reporter from './reporter';

export const metricsRuntime = makeMetricsRuntime(METRICS_CONFIG, logger);
const httpMetrics = makeHttpMetrics(metricsRuntime.metrics);
const queueMetrics = makeQueueMetrics(metricsRuntime.metrics);

const observability = {
  httpMetrics,
  logger,
  metrics: metricsRuntime.metrics,
  queueMetrics,
  reporter,
};

export default observability;
