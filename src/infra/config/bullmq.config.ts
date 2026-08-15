import { Worker } from 'bullmq';

import { ICorrelationId } from '@shared/types/correlation-id.types';

import IAppContext, {
  IAppContextData,
} from '@app/context/contracts/app-context.contract';

import reporter from '@infra/observability/reporter';

import { getQueueConnection } from './redis.config';

export function registerBullMQWorker<T extends ICorrelationId>(
  name: string,
  processor: (payload: T) => Promise<void>,
  appContext: IAppContext,
  getInitialStore: (payload: T) => IAppContextData
): Worker<T> {
  return new Worker<T>(
    name,
    async (job) => {
      const initialStore = getInitialStore(job.data);

      return appContext.init(initialStore, async () => {
        try {
          await processor(job.data);
        } catch (error) {
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
