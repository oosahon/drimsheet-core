import { BETTER_STACK_CONFIG } from '@infra/config/better-stack.config';
import makeMetricsRuntime from '@infra/runtime/observability-runtime';

import makeHttpMetrics from './http-metrics';
import logger, { betterStackLogRuntime } from './logger';
import makeQueueMetrics from './queue-metrics';
import reporter from './reporter';
import tracer from './tracer';

export const metricsRuntime = makeMetricsRuntime(BETTER_STACK_CONFIG, logger);
export { betterStackLogRuntime };
const httpMetrics = makeHttpMetrics(metricsRuntime.metrics);
const queueMetrics = makeQueueMetrics(metricsRuntime.metrics);

const observability = {
  httpMetrics,
  logger,
  metrics: metricsRuntime.metrics,
  queueMetrics,
  reporter,
  tracer,
};

export default observability;
