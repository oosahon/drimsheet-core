import amqplib, { Channel, RecoveringChannelModel } from 'amqplib';
import IReporter from '../../app/shared/contracts/reporter.contract';
import { RABBITMQ_URL } from './vars.config';

let connection: RecoveringChannelModel | null = null;

export interface IRabbitMQConsumerConfig<T> {
  exchange: string;
  exchangeType: 'topic' | 'direct' | 'fanout' | 'headers';
  exchangeArguments?: Record<string, unknown>;
  queue: string;
  routingKey: string;
  prefetch?: number;
  processor: (payload: T) => Promise<void>;
}

export async function connectRabbitMQ(
  reporter: IReporter
): Promise<RecoveringChannelModel> {
  if (connection) return connection;

  connection = await amqplib.connect(RABBITMQ_URL, { recovery: true });

  connection.on('disconnect', (err) => {
    reporter.report(err, { context: 'RabbitMQ disconnected' });
  });

  return connection;
}

export async function registerRabbitMQConsumer<T>(
  connection: RecoveringChannelModel,
  config: IRabbitMQConsumerConfig<T>,
  reporter: IReporter
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

    try {
      const payload = JSON.parse(msg.content.toString()) as T;
      await config.processor(payload);
      channel.ack(msg);
    } catch (error) {
      reporter.report(error, {
        context: 'Failed to process RabbitMQ message',
        queue: config.queue,
      });
      channel.nack(msg, false, false);
    }
  });

  return channel;
}
