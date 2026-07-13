import IExchangeRateIngestion from '../../../app/money/contracts/exchange-rate-ingestion.contract';
import IReporter from '../../../shared/contracts/reporter.contract';
import {
  connectRabbitMQ,
  IRabbitMQConsumerConfig,
  registerRabbitMQConsumer,
} from '../../config/rabbitmq.config';
import currencyWorkers from '../../ioc/workers/money.workers';

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
    processor: currencyWorkers.exchangeRateIngestion,
  };

  await registerRabbitMQConsumer(connection, config, reporter);
}
