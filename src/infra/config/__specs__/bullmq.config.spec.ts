import { Job, Processor, Worker } from 'bullmq';

import { ICorrelationId } from '@shared/types/correlation-id.types';

import { IAppContextData } from '@app/context/contracts/app-context.contract';

import { registerBullMQWorker } from '@infra/config/bullmq.config';
import reporter from '@infra/observability/reporter';
import appContext from '@infra/runtime/app-context';

jest.mock('bullmq', () => ({
  Worker: jest.fn(),
}));

jest.mock('../redis.config', () => ({
  getQueueConnection: jest.fn(() => ({ host: 'mock-redis' })),
}));

jest.mock('../../observability/reporter', () => ({
  __esModule: true,
  default: {
    report: jest.fn(),
    reportAbuse: jest.fn(),
  },
}));

describe('registerBullMQWorker', () => {
  const getInitialStore = (payload: ICorrelationId): IAppContextData => ({
    correlationId: payload.correlationId,
    idempotencyKey: '',
  });

  function getRegisteredProcessor() {
    const processor = jest.mocked(Worker).mock.calls[0][1];

    if (!processor) {
      throw new Error('Expected a registered BullMQ processor');
    }

    return processor as Processor<ICorrelationId, void, string>;
  }

  function makeJob(correlationId: string) {
    return {
      data: { correlationId },
    } as Job<ICorrelationId>;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runs processing inside the payload context', async () => {
    const processor = jest.fn(async () => {
      expect(appContext.get().correlationId).toBe('job-correlation');
    });

    registerBullMQWorker('test-queue', processor, appContext, getInitialStore);

    await getRegisteredProcessor()(makeJob('job-correlation'));

    expect(processor).toHaveBeenCalledWith({
      correlationId: 'job-correlation',
    });
    expect(reporter.report).not.toHaveBeenCalled();
  });

  it('reports and rethrows processing failures inside the payload context', async () => {
    const processingError = new Error('processing failed');
    const processor = jest.fn().mockRejectedValue(processingError);
    jest.mocked(reporter.report).mockImplementation(() => {
      expect(appContext.get().correlationId).toBe('failed-job-correlation');
    });

    registerBullMQWorker('test-queue', processor, appContext, getInitialStore);

    const job = makeJob('failed-job-correlation');
    await expect(getRegisteredProcessor()(job)).rejects.toBe(processingError);

    expect(reporter.report).toHaveBeenCalledWith(
      'queue.job.processing_failed',
      processingError,
      { job }
    );
  });

  it('isolates concurrent job contexts', async () => {
    let releaseFirst: (() => void) | undefined;
    const firstCanFinish = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const observations: string[] = [];
    const processor = jest.fn(async (payload: ICorrelationId) => {
      observations.push(appContext.get().correlationId);

      if (payload.correlationId === 'first-correlation') {
        await firstCanFinish;
      } else {
        releaseFirst?.();
      }

      observations.push(appContext.get().correlationId);
    });

    registerBullMQWorker('test-queue', processor, appContext, getInitialStore);
    const registeredProcessor = getRegisteredProcessor();

    await Promise.all([
      registeredProcessor(makeJob('first-correlation')),
      registeredProcessor(makeJob('second-correlation')),
    ]);

    expect(observations).toEqual([
      'first-correlation',
      'second-correlation',
      'second-correlation',
      'first-correlation',
    ]);
  });
});
