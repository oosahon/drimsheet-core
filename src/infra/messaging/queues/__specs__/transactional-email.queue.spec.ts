import mockQueueMetrics from '@shared/contracts/__mocks__/queue-metrics.mock';
import mockReporter from '@shared/contracts/__mocks__/reporter.mock';

import { ITransactionalEmailDto } from '@app/notification/dtos/transactional-email/transactional-email.dto';

import makeTransactionalEmailQueue from '@infra/messaging/queues/transactional-email.queue';

const mockQueueAdd = jest.fn();

jest.mock('bullmq', () => ({
  Queue: jest.fn(() => ({ add: mockQueueAdd })),
}));

jest.mock('../../../config/redis.config', () => ({
  getQueueConnection: jest.fn(() => ({ host: 'mock-redis' })),
}));

describe('makeTransactionalEmailQueue', () => {
  const payload: ITransactionalEmailDto = {
    correlationId: 'queue-correlation',
    emails: ['recipient@example.com'],
    subject: 'Test email',
    html: '<p>Test</p>',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueueAdd.mockReset();
  });

  it('records a successful enqueue after BullMQ accepts the job', async () => {
    mockQueueAdd.mockResolvedValue(undefined);
    const queue = makeTransactionalEmailQueue(mockReporter, mockQueueMetrics);

    await queue.add(payload);

    expect(mockQueueMetrics.recordEnqueueSucceeded).toHaveBeenCalledWith({
      queueName: 'transactional-email-queue',
      transport: 'bullmq',
    });
    expect(mockQueueMetrics.recordEnqueueFailed).not.toHaveBeenCalled();
  });

  it('reports an enqueue event and preserves rejection semantics', async () => {
    const failure = new Error('queue unavailable');
    mockQueueAdd.mockRejectedValue(failure);
    const queue = makeTransactionalEmailQueue(mockReporter, mockQueueMetrics);

    await expect(queue.add(payload)).rejects.toBe(failure);

    expect(mockReporter.report).toHaveBeenCalledWith(
      'queue.job.enqueue_failed',
      failure,
      {
        type: 'transactional-email-queue',
        correlationId: payload.correlationId,
      }
    );
    expect(mockQueueMetrics.recordEnqueueFailed).toHaveBeenCalledWith({
      queueName: 'transactional-email-queue',
      transport: 'bullmq',
    });
    expect(mockQueueMetrics.recordEnqueueSucceeded).not.toHaveBeenCalled();
  });
});
