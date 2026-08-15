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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports an enqueue event and preserves rejection semantics', async () => {
    const failure = new Error('queue unavailable');
    const payload: ITransactionalEmailDto = {
      correlationId: 'queue-correlation',
      emails: ['recipient@example.com'],
      subject: 'Test email',
      html: '<p>Test</p>',
    };
    mockQueueAdd.mockRejectedValue(failure);
    const queue = makeTransactionalEmailQueue(mockReporter);

    await expect(queue.add(payload)).rejects.toBe(failure);

    expect(mockReporter.report).toHaveBeenCalledWith(
      'queue.job.enqueue_failed',
      failure,
      {
        type: 'transactional-email-queue',
        correlationId: payload.correlationId,
      }
    );
  });
});
