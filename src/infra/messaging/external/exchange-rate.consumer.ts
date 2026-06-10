import IExchangeRateIngestion from '../../../app/currency/contracts/exchange-rate-ingestion.contract';
import IReporter from '../../../app/shared/contracts/reporter.contract';
import workers from '../../../app/shared/handlers/queue-workers.index';
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
    processor: workers.exchangeRateIngestion,
  };

  await registerRabbitMQConsumer(connection, config, reporter);
}
