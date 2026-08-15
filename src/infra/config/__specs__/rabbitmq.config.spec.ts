import { ConsumeMessage, RecoveringChannelModel } from 'amqplib';

import mockQueueMetrics from '@shared/contracts/__mocks__/queue-metrics.mock';
import mockReporter from '@shared/contracts/__mocks__/reporter.mock';

import {
  IRabbitMQConsumerConfig,
  registerRabbitMQConsumer,
} from '@infra/config/rabbitmq.config';
import appContext from '@infra/runtime/app-context';

interface ITestPayload {
  correlationId: string;
}

describe('registerRabbitMQConsumer', () => {
  const channel = {
    assertExchange: jest.fn().mockResolvedValue(undefined),
    assertQueue: jest.fn().mockResolvedValue(undefined),
    bindQueue: jest.fn().mockResolvedValue(undefined),
    prefetch: jest.fn().mockResolvedValue(undefined),
    consume: jest.fn().mockResolvedValue(undefined),
    ack: jest.fn(),
    nack: jest.fn(),
  };
  const connection = {
    createChannel: jest.fn().mockResolvedValue(channel),
  } as unknown as RecoveringChannelModel;

  function makeConfig(
    processor: IRabbitMQConsumerConfig<ITestPayload>['processor']
  ): IRabbitMQConsumerConfig<ITestPayload> {
    return {
      exchange: 'test-exchange',
      exchangeType: 'direct',
      queue: 'test-queue',
      routingKey: 'test-route',
      processor,
      getInitialStore: (payload) => ({
        correlationId: payload.correlationId,
        idempotencyKey: '',
      }),
    };
  }

  function makeMessage(payload: ITestPayload): ConsumeMessage {
    return {
      content: Buffer.from(JSON.stringify(payload)),
    } as ConsumeMessage;
  }

  function getRegisteredConsumer() {
    const consumer = channel.consume.mock.calls[0][1];

    if (!consumer) {
      throw new Error('Expected a registered RabbitMQ consumer');
    }

    return consumer as unknown as (
      message: ConsumeMessage | null
    ) => Promise<void>;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockReporter.report.mockReset();
    channel.ack.mockReset();
    channel.nack.mockReset();
  });

  it('runs processing and acknowledgement inside the message context', async () => {
    const processor = jest.fn(async () => {
      expect(appContext.get().correlationId).toBe('message-correlation');
    });
    channel.ack.mockImplementation(() => {
      expect(appContext.get().correlationId).toBe('message-correlation');
    });

    await registerRabbitMQConsumer(
      connection,
      makeConfig(processor),
      mockReporter,
      appContext,
      mockQueueMetrics
    );

    const message = makeMessage({ correlationId: 'message-correlation' });
    await getRegisteredConsumer()(message);

    expect(processor).toHaveBeenCalledWith({
      correlationId: 'message-correlation',
    });
    expect(channel.ack).toHaveBeenCalledWith(message);
    expect(channel.nack).not.toHaveBeenCalled();
    expect(mockReporter.report).not.toHaveBeenCalled();
    expect(mockQueueMetrics.recordProcessingCompleted).toHaveBeenCalledWith({
      queueName: 'test-queue',
      transport: 'rabbitmq',
      durationMs: expect.any(Number),
    });
    expect(mockQueueMetrics.recordProcessingFailed).not.toHaveBeenCalled();
  });

  it('reports and negatively acknowledges failures inside the message context', async () => {
    const processingError = new Error('processing failed');
    const processor = jest.fn().mockRejectedValue(processingError);
    mockReporter.report.mockImplementation(() => {
      expect(appContext.get().correlationId).toBe('failed-message-correlation');
    });
    channel.nack.mockImplementation(() => {
      expect(appContext.get().correlationId).toBe('failed-message-correlation');
    });

    await registerRabbitMQConsumer(
      connection,
      makeConfig(processor),
      mockReporter,
      appContext,
      mockQueueMetrics
    );

    const message = makeMessage({
      correlationId: 'failed-message-correlation',
    });
    await getRegisteredConsumer()(message);

    expect(mockReporter.report).toHaveBeenCalledWith(
      'queue.message.processing_failed',
      processingError,
      {
        context: 'Failed to process RabbitMQ message',
        queue: 'test-queue',
      }
    );
    expect(channel.ack).not.toHaveBeenCalled();
    expect(channel.nack).toHaveBeenCalledWith(message, false, false);
    expect(mockQueueMetrics.recordProcessingFailed).toHaveBeenCalledWith({
      queueName: 'test-queue',
      transport: 'rabbitmq',
      durationMs: expect.any(Number),
    });
    expect(mockQueueMetrics.recordProcessingCompleted).not.toHaveBeenCalled();
  });

  it('keeps parsing failures on the uncorrelated transport path', async () => {
    const processor = jest.fn();

    await registerRabbitMQConsumer(
      connection,
      makeConfig(processor),
      mockReporter,
      appContext,
      mockQueueMetrics
    );

    const message = {
      content: Buffer.from('{invalid-json'),
    } as ConsumeMessage;
    await getRegisteredConsumer()(message);

    expect(processor).not.toHaveBeenCalled();
    expect(mockReporter.report).toHaveBeenCalledWith(
      'queue.message.processing_failed',
      expect.any(SyntaxError),
      {
        context: 'Failed to process RabbitMQ message',
        queue: 'test-queue',
      }
    );
    expect(channel.nack).toHaveBeenCalledWith(message, false, false);
    expect(mockQueueMetrics.recordProcessingFailed).toHaveBeenCalledWith({
      queueName: 'test-queue',
      transport: 'rabbitmq',
      durationMs: expect.any(Number),
    });
  });

  it('ignores consumer cancellation notifications', async () => {
    const processor = jest.fn();

    await registerRabbitMQConsumer(
      connection,
      makeConfig(processor),
      mockReporter,
      appContext,
      mockQueueMetrics
    );

    await getRegisteredConsumer()(null);

    expect(processor).not.toHaveBeenCalled();
    expect(channel.ack).not.toHaveBeenCalled();
    expect(channel.nack).not.toHaveBeenCalled();
    expect(mockQueueMetrics.recordProcessingCompleted).not.toHaveBeenCalled();
    expect(mockQueueMetrics.recordProcessingFailed).not.toHaveBeenCalled();
  });
});
