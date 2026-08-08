import { Worker } from 'bullmq';

import { ICorrelationId } from '@shared/types/correlation-id.types';

import reporter from '@infra/observability/reporter';

import { getQueueConnection } from './redis.config';

export function registerBullMQWorker<T extends ICorrelationId>(
  name: string,
  processor: (payload: T) => Promise<void>
): Worker<T> {
  return new Worker<T>(
    name,
    async (job) => {
      try {
        await processor(job.data);
      } catch (error) {
        reporter.report(error, { job });
        throw error;
      }
    },
    {
      connection: getQueueConnection(),
    }
  );
}
