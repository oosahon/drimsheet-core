import { performance } from 'node:perf_hooks';

import { Job, Worker } from 'bullmq';

import IQueueMetrics, {
  EQueueTransport,
} from '@shared/contracts/queue-metrics.contract';
import { ICorrelationId } from '@shared/types/correlation-id.types';

import IAppContext, {
  IAppContextData,
} from '@app/context/contracts/app-context.contract';

import reporter from '@infra/observability/reporter';

import { getQueueConnection } from './redis.config';

function getWaitingDurationMs<T>(job: Job<T>) {
  const processedOn = job.processedOn;

  const shouldReturnUndefined =
    processedOn === undefined ||
    !Number.isFinite(job.timestamp) ||
    !Number.isFinite(processedOn);

  if (shouldReturnUndefined) {
    return undefined;
  }

  return Math.max(0, processedOn - job.timestamp);
}

export function registerBullMQWorker<T extends ICorrelationId>(
  name: string,
  processor: (payload: T) => Promise<void>,
  appContext: IAppContext,
  getInitialStore: (payload: T) => IAppContextData,
  queueMetrics: IQueueMetrics
): Worker<T> {
  return new Worker<T>(
    name,
    async (job) => {
      const initialStore = getInitialStore(job.data);

      return appContext.init(initialStore, async () => {
        const processingStartedAt = performance.now();
        const processingObservation = {
          queueName: name,
          transport: EQueueTransport.BullMQ,
          attempt: job.attemptsMade + 1,
          waitingDurationMs: getWaitingDurationMs(job),
        };

        try {
          await processor(job.data);
          queueMetrics.recordProcessingCompleted({
            ...processingObservation,
            durationMs: performance.now() - processingStartedAt,
          });
        } catch (error) {
          queueMetrics.recordProcessingFailed({
            ...processingObservation,
            durationMs: performance.now() - processingStartedAt,
          });
          reporter.report('queue.job.processing_failed', error, { job });
          throw error;
        }
      });
    },
    {
      connection: getQueueConnection(),
    }
  );
}
