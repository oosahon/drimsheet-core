import IQueueMetrics from '@shared/contracts/queue-metrics.contract';
import IReporter from '@shared/contracts/reporter.contract';
import ITracer from '@shared/contracts/tracer.contract';
import generateUUID from '@shared/utils/uuid-generator';

import IAppContext from '@app/context/contracts/app-context.contract';
import IExchangeRateIngestion from '@app/money/contracts/exchange-rate-ingestion.contract';

import {
  connectRabbitMQ,
  IRabbitMQConsumerConfig,
  registerRabbitMQConsumer,
} from '@infra/config/rabbitmq.config';
import { exchangeRateIngestionWorker } from '@infra/ioc/workers/money';

export default async function registerExchangeRateConsumer(
  reporter: IReporter,
  appContext: IAppContext,
  queueMetrics: IQueueMetrics,
  tracer: ITracer
) {
  const connection = await connectRabbitMQ(reporter);

  const config: IRabbitMQConsumerConfig<
    IExchangeRateIngestion['message']['payload']
  > = {
    exchange: 'ingestion.exchange-rate',
    exchangeType: 'direct',
    exchangeArguments: {
      'alternate-exchange': 'ingestion.exchange-rate.unroutable',
    },
    queue: 'drimsheet-core.exchange-rate.ingested',
    routingKey: 'exchange-rate.ingested',
    processor: exchangeRateIngestionWorker,
    getInitialStore: (payload) => ({
      correlationId: payload.correlation_id || generateUUID(),
      idempotencyKey: '',
    }),
  };

  await registerRabbitMQConsumer(
    connection,
    config,
    reporter,
    appContext,
    queueMetrics,
    tracer
  );
}
