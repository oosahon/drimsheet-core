import { performance } from 'node:perf_hooks';

import amqplib, { Channel, RecoveringChannelModel } from 'amqplib';

import IQueueMetrics, {
  EQueueTransport,
} from '@shared/contracts/queue-metrics.contract';
import IReporter from '@shared/contracts/reporter.contract';
import ITracer, { ITraceCarrier } from '@shared/contracts/tracer.contract';

import IAppContext, {
  IAppContextData,
} from '@app/context/contracts/app-context.contract';

import { traceQueueProcessing } from '@infra/messaging/trace-context';

import vars from './vars.config';

let connection: RecoveringChannelModel | null = null;

function getTraceCarrier(msg: amqplib.ConsumeMessage): ITraceCarrier {
  const headers = msg.properties?.headers;
  if (!headers || typeof headers !== 'object') return {};

  const sentryTrace = headers['sentry-trace'];
  const baggage = headers.baggage;

  return {
    ...(typeof sentryTrace === 'string' ? { sentryTrace } : {}),
    ...(typeof baggage === 'string' ? { baggage } : {}),
  };
}

export interface IRabbitMQConsumerConfig<T> {
  exchange: string;
  exchangeType: 'topic' | 'direct' | 'fanout' | 'headers';
  exchangeArguments?: Record<string, unknown>;
  queue: string;
  routingKey: string;
  prefetch?: number;
  processor: (payload: T) => Promise<void>;
  getInitialStore: (payload: T) => IAppContextData;
}

export async function connectRabbitMQ(
  reporter: IReporter
): Promise<RecoveringChannelModel> {
  if (connection) return connection;

  connection = await amqplib.connect(vars.RABBITMQ_URL, { recovery: true });

  connection.on('disconnect', (err) => {
    reporter.report('integration.rabbitmq.disconnected', err);
  });

  return connection;
}

export async function registerRabbitMQConsumer<T>(
  connection: RecoveringChannelModel,
  config: IRabbitMQConsumerConfig<T>,
  reporter: IReporter,
  appContext: IAppContext,
  queueMetrics: IQueueMetrics,
  tracer: ITracer
): Promise<Channel> {
  const channel = await connection.createChannel();

  await channel.assertExchange(config.exchange, config.exchangeType, {
    durable: true,
    arguments: config.exchangeArguments,
  });

  await channel.assertQueue(config.queue, { durable: true });

  await channel.bindQueue(config.queue, config.exchange, config.routingKey);

  await channel.prefetch(config.prefetch ?? 1);

  await channel.consume(config.queue, async (msg) => {
    if (!msg) return;
    const trace = getTraceCarrier(msg);

    return traceQueueProcessing(
      tracer,
      config.queue,
      EQueueTransport.RabbitMQ,
      trace,
      async () => {
        const processingStartedAt = performance.now();

        const getProcessingMetricInput = () => ({
          queueName: config.queue,
          transport: EQueueTransport.RabbitMQ,
          durationMs: performance.now() - processingStartedAt,
        });

        try {
          const payload = JSON.parse(msg.content.toString()) as T;
          const initialStore = config.getInitialStore(payload);

          await appContext.init(initialStore, async () => {
            let processorCompleted = false;

            try {
              await config.processor(payload);
              processorCompleted = true;
              queueMetrics.recordProcessingCompleted(
                getProcessingMetricInput()
              );
              channel.ack(msg);
            } catch (error) {
              if (!processorCompleted) {
                queueMetrics.recordProcessingFailed(getProcessingMetricInput());
              }
              reporter.report('queue.message.processing_failed', error, {
                queue: config.queue,
                transport: EQueueTransport.RabbitMQ,
              });
              channel.nack(msg, false, false);
            }
          });
        } catch (error) {
          queueMetrics.recordProcessingFailed(getProcessingMetricInput());
          reporter.report('queue.message.processing_failed', error, {
            queue: config.queue,
            transport: EQueueTransport.RabbitMQ,
          });
          channel.nack(msg, false, false);
        }
      }
    );
  });

  return channel;
}
