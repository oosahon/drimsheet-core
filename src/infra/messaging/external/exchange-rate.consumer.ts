import IReporter from '@shared/contracts/reporter.contract';

import IExchangeRateIngestion from '@app/money/contracts/exchange-rate-ingestion.contract';

import {
  connectRabbitMQ,
  IRabbitMQConsumerConfig,
  registerRabbitMQConsumer,
} from '@infra/config/rabbitmq.config';
import { exchangeRateIngestionWorker } from '@infra/ioc/workers/money';

export default async function registerExchangeRateConsumer(
  reporter: IReporter
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
    queue: 'pl-core.exchange-rate.ingested',
    routingKey: 'exchange-rate.ingested',
    processor: exchangeRateIngestionWorker,
  };

  await registerRabbitMQConsumer(connection, config, reporter);
}
