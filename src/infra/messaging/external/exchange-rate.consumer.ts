import IExchangeRateIngestion from '../../../app/currency/contracts/exchange-rate-ingestion.contract';
import currencyWorkers from '../../../app/currency/workers';
import IReporter from '../../../app/shared/contracts/reporter.contract';
import {
  connectRabbitMQ,
  IRabbitMQConsumerConfig,
  registerRabbitMQConsumer,
} from '../../config/rabbitmq.config';

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
