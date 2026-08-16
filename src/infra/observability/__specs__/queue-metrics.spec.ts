import mockObservabilityMetrics from '@shared/contracts/__mocks__/observability-metrics.mock';

import makeQueueMetrics from '@infra/observability/queue-metrics';

describe('queue metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records successful and failed enqueue operations', () => {
    const queueMetrics = makeQueueMetrics(mockObservabilityMetrics);

    queueMetrics.recordEnqueueSucceeded({
      queueName: 'email',
      transport: 'bullmq',
    });
    queueMetrics.recordEnqueueFailed({
      queueName: 'exchange-rate',
      transport: 'rabbitmq',
    });

    expect(mockObservabilityMetrics.increment).toHaveBeenNthCalledWith(1, {
      name: 'messaging.client.enqueue.operations',
      description: 'Messaging enqueue operations',
      unit: '{operation}',
      value: 1,
      attributes: {
        queue: 'email',
        transport: 'bullmq',
        outcome: 'success',
      },
    });
    expect(mockObservabilityMetrics.increment).toHaveBeenNthCalledWith(2, {
      name: 'messaging.client.enqueue.operations',
      description: 'Messaging enqueue operations',
      unit: '{operation}',
      value: 1,
      attributes: {
        queue: 'exchange-rate',
        transport: 'rabbitmq',
        outcome: 'failure',
      },
    });
  });

  it('records processing count, duration, trusted wait, and bounded attempts', () => {
    const queueMetrics = makeQueueMetrics(mockObservabilityMetrics);

    queueMetrics.recordProcessingCompleted({
      queueName: 'email',
      transport: 'bullmq',
      attempt: 50,
      durationMs: 125,
      waitingDurationMs: 1_500,
    });

    expect(mockObservabilityMetrics.increment).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'messaging.process.operations',
        attributes: {
          queue: 'email',
          transport: 'bullmq',
          outcome: 'success',
          attempt: 10,
        },
      })
    );
    expect(mockObservabilityMetrics.observe).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: 'messaging.process.duration',
        value: 0.125,
        attributes: {
          queue: 'email',
          transport: 'bullmq',
          outcome: 'success',
        },
      })
    );
    expect(mockObservabilityMetrics.observe).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        name: 'messaging.process.wait.duration',
        value: 1.5,
        attributes: {
          queue: 'email',
          transport: 'bullmq',
        },
      })
    );
  });

  it('records processing failures without inventing unavailable attributes', () => {
    const queueMetrics = makeQueueMetrics(mockObservabilityMetrics);

    queueMetrics.recordProcessingFailed({
      queueName: 'exchange-rate',
      transport: 'rabbitmq',
      durationMs: 300,
    });

    expect(mockObservabilityMetrics.increment).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: {
          queue: 'exchange-rate',
          transport: 'rabbitmq',
          outcome: 'failure',
        },
      })
    );
    expect(mockObservabilityMetrics.observe).toHaveBeenCalledTimes(1);
    expect(mockObservabilityMetrics.observe).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'messaging.process.duration',
        value: 0.3,
      })
    );
  });

  it('bounds an invalid attempt when a provider supplies one', () => {
    const queueMetrics = makeQueueMetrics(mockObservabilityMetrics);

    queueMetrics.recordProcessingFailed({
      queueName: 'email',
      transport: 'bullmq',
      attempt: Number.NaN,
      durationMs: 300,
    });

    expect(mockObservabilityMetrics.increment).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: expect.objectContaining({ attempt: 1 }),
      })
    );
  });
});
