import amqplib, { ConsumeMessage, RecoveringChannelModel } from 'amqplib';

import mockQueueMetrics from '@shared/contracts/__mocks__/queue-metrics.mock';
import mockReporter from '@shared/contracts/__mocks__/reporter.mock';
import mockTracer from '@shared/contracts/__mocks__/tracer.mock';

import {
  connectRabbitMQ,
  IRabbitMQConsumerConfig,
  registerRabbitMQConsumer,
} from '@infra/config/rabbitmq.config';
import appContext from '@infra/runtime/app-context';

jest.mock('amqplib', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
  },
}));

interface ITestPayload {
  correlationId: string;
}

describe('connectRabbitMQ', () => {
  const amqpClient = jest.mocked(amqplib);
  const connectedRabbitMQ = {
    on: jest.fn(),
  } as unknown as RecoveringChannelModel;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReporter.report.mockReset();
    amqpClient.connect.mockReset();
  });

  it('connects once and reports disconnects', async () => {
    amqpClient.connect.mockResolvedValue(
      connectedRabbitMQ as Awaited<ReturnType<typeof amqplib.connect>>
    );

    const firstConnection = await connectRabbitMQ(mockReporter);
    const secondConnection = await connectRabbitMQ(mockReporter);

    expect(firstConnection).toBe(connectedRabbitMQ);
    expect(secondConnection).toBe(connectedRabbitMQ);
    expect(amqpClient.connect).toHaveBeenCalledTimes(1);
    expect(amqpClient.connect).toHaveBeenCalledWith('', { recovery: true });
    expect(connectedRabbitMQ.on).toHaveBeenCalledWith(
      'disconnect',
      expect.any(Function)
    );

    const disconnectHandler = (connectedRabbitMQ.on as jest.Mock).mock
      .calls[0][1] as (error: Error) => void;
    const disconnectError = new Error('connection lost');
    disconnectHandler(disconnectError);

    expect(mockReporter.report).toHaveBeenCalledWith(
      'integration.rabbitmq.disconnected',
      disconnectError
    );
  });
});

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

  function makeMessage(
    payload: ITestPayload,
    headers?: Record<string, unknown>
  ): ConsumeMessage {
    return {
      content: Buffer.from(JSON.stringify(payload)),
      properties: { headers },
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
    mockTracer.continueTrace.mockImplementation((_carrier, operation) =>
      operation()
    );
    mockTracer.startRootSpan.mockImplementation((_options, operation) =>
      operation()
    );
    mockTracer.startSpan.mockImplementation((_options, operation) =>
      operation()
    );
  });

  it('declares the RabbitMQ topology with configured options', async () => {
    const processor = jest.fn();
    const config: IRabbitMQConsumerConfig<ITestPayload> = {
      ...makeConfig(processor),
      exchangeArguments: { alternateExchange: 'fallback-exchange' },
      prefetch: 5,
    };

    const registeredChannel = await registerRabbitMQConsumer(
      connection,
      config,
      mockReporter,
      appContext,
      mockQueueMetrics,
      mockTracer
    );

    expect(registeredChannel).toBe(channel);
    expect(channel.assertExchange).toHaveBeenCalledWith(
      'test-exchange',
      'direct',
      {
        durable: true,
        arguments: { alternateExchange: 'fallback-exchange' },
      }
    );
    expect(channel.assertQueue).toHaveBeenCalledWith('test-queue', {
      durable: true,
    });
    expect(channel.bindQueue).toHaveBeenCalledWith(
      'test-queue',
      'test-exchange',
      'test-route'
    );
    expect(channel.prefetch).toHaveBeenCalledWith(5);
    expect(channel.consume).toHaveBeenCalledWith(
      'test-queue',
      expect.any(Function)
    );
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
      mockQueueMetrics,
      mockTracer
    );

    const message = makeMessage(
      { correlationId: 'message-correlation' },
      {
        'sentry-trace': 'incoming-trace',
        baggage: 'incoming-baggage',
      }
    );
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
    expect(mockTracer.continueTrace).toHaveBeenCalledWith(
      {
        sentryTrace: 'incoming-trace',
        baggage: 'incoming-baggage',
      },
      expect.any(Function)
    );
  });

  it('uses default topology options and ignores non-string trace headers', async () => {
    const processor = jest.fn().mockResolvedValue(undefined);

    await registerRabbitMQConsumer(
      connection,
      makeConfig(processor),
      mockReporter,
      appContext,
      mockQueueMetrics,
      mockTracer
    );

    const message = makeMessage(
      { correlationId: 'message-correlation' },
      {
        'sentry-trace': 123,
        baggage: ['incoming-baggage'],
      }
    );
    await getRegisteredConsumer()(message);

    expect(channel.assertExchange).toHaveBeenCalledWith(
      'test-exchange',
      'direct',
      {
        durable: true,
        arguments: undefined,
      }
    );
    expect(channel.prefetch).toHaveBeenCalledWith(1);
    expect(mockTracer.startRootSpan).toHaveBeenCalledWith(
      {
        name: 'queue.test_queue',
        operation: 'queue.process',
        attributes: {
          'messaging.destination.name': 'test-queue',
          'messaging.operation.type': 'process',
          'messaging.system': 'rabbitmq',
        },
      },
      expect.any(Function)
    );
    expect(mockTracer.continueTrace).not.toHaveBeenCalled();
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
      mockQueueMetrics,
      mockTracer
    );

    const message = makeMessage({
      correlationId: 'failed-message-correlation',
    });
    await getRegisteredConsumer()(message);

    expect(mockReporter.report).toHaveBeenCalledWith(
      'queue.message.processing_failed',
      processingError,
      {
        queue: 'test-queue',
        transport: 'rabbitmq',
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
    expect(mockTracer.startRootSpan).toHaveBeenCalledTimes(1);
  });

  it('does not double-record failures after processing has completed', async () => {
    const ackError = new Error('ack failed');
    const processor = jest.fn().mockResolvedValue(undefined);
    channel.ack.mockImplementation(() => {
      throw ackError;
    });

    await registerRabbitMQConsumer(
      connection,
      makeConfig(processor),
      mockReporter,
      appContext,
      mockQueueMetrics,
      mockTracer
    );

    const message = makeMessage({
      correlationId: 'ack-failed-message-correlation',
    });
    await getRegisteredConsumer()(message);

    expect(mockQueueMetrics.recordProcessingCompleted).toHaveBeenCalledWith({
      queueName: 'test-queue',
      transport: 'rabbitmq',
      durationMs: expect.any(Number),
    });
    expect(mockQueueMetrics.recordProcessingFailed).not.toHaveBeenCalled();
    expect(mockReporter.report).toHaveBeenCalledWith(
      'queue.message.processing_failed',
      ackError,
      {
        queue: 'test-queue',
        transport: 'rabbitmq',
      }
    );
    expect(channel.nack).toHaveBeenCalledWith(message, false, false);
  });

  it('keeps parsing failures on the uncorrelated transport path', async () => {
    const processor = jest.fn();

    await registerRabbitMQConsumer(
      connection,
      makeConfig(processor),
      mockReporter,
      appContext,
      mockQueueMetrics,
      mockTracer
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
        queue: 'test-queue',
        transport: 'rabbitmq',
      }
    );
    expect(channel.nack).toHaveBeenCalledWith(message, false, false);
    expect(mockQueueMetrics.recordProcessingFailed).toHaveBeenCalledWith({
      queueName: 'test-queue',
      transport: 'rabbitmq',
      durationMs: expect.any(Number),
    });
    expect(mockTracer.startRootSpan).toHaveBeenCalledTimes(1);
  });

  it('ignores consumer cancellation notifications', async () => {
    const processor = jest.fn();

    await registerRabbitMQConsumer(
      connection,
      makeConfig(processor),
      mockReporter,
      appContext,
      mockQueueMetrics,
      mockTracer
    );

    await getRegisteredConsumer()(null);

    expect(processor).not.toHaveBeenCalled();
    expect(channel.ack).not.toHaveBeenCalled();
    expect(channel.nack).not.toHaveBeenCalled();
    expect(mockQueueMetrics.recordProcessingCompleted).not.toHaveBeenCalled();
    expect(mockQueueMetrics.recordProcessingFailed).not.toHaveBeenCalled();
  });
});
