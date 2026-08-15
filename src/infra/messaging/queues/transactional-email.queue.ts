import { Queue } from 'bullmq';

import IQueueMetrics, {
  EQueueTransport,
} from '@shared/contracts/queue-metrics.contract';
import IReporter from '@shared/contracts/reporter.contract';

import ITransactionalEmailQueue, {
  TRANSACTIONAL_EMAIL_QUEUE_NAME,
} from '@app/notification/contracts/transactional-email-queue.contract';
import { ITransactionalEmailDto } from '@app/notification/dtos/transactional-email/transactional-email.dto';

import { getQueueConnection } from '@infra/config/redis.config';

let transactionalEmailQueue: Queue<ITransactionalEmailDto> | undefined;

export function getTransactionalEmailQueue(): Queue<ITransactionalEmailDto> {
  transactionalEmailQueue ??= new Queue(TRANSACTIONAL_EMAIL_QUEUE_NAME, {
    connection: getQueueConnection(),
    // @ts-expect-error: BullMQ types are not compatible with ioredis types
    limiter: {
      max: 100,
      duration: 1000,
    },
  });

  return transactionalEmailQueue;
}

function getConfig(payload: ITransactionalEmailDto) {
  return Object.freeze({
    jobId: `${TRANSACTIONAL_EMAIL_QUEUE_NAME}_${payload.correlationId}`,
    removeOnComplete: true,
    removeOnFail: 20,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5_000,
    },
  });
}

export default function makeTransactionalEmailQueue(
  reporter: IReporter,
  queueMetrics: IQueueMetrics
): ITransactionalEmailQueue {
  return {
    async add(payload) {
      try {
        await getTransactionalEmailQueue().add(
          TRANSACTIONAL_EMAIL_QUEUE_NAME,
          payload,
          getConfig(payload)
        );
        queueMetrics.recordEnqueueSucceeded({
          queueName: TRANSACTIONAL_EMAIL_QUEUE_NAME,
          transport: EQueueTransport.BullMQ,
        });
      } catch (error) {
        queueMetrics.recordEnqueueFailed({
          queueName: TRANSACTIONAL_EMAIL_QUEUE_NAME,
          transport: EQueueTransport.BullMQ,
        });
        reporter.report('queue.job.enqueue_failed', error, {
          type: TRANSACTIONAL_EMAIL_QUEUE_NAME,
          correlationId: payload.correlationId,
        });
        throw error;
      }
    },
  };
}
