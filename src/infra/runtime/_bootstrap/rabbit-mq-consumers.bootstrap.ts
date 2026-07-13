import registerExchangeRateConsumer from '../../messaging/external/exchange-rate.consumer';
import observability from '../../observability';

export default async function registerRabbitMQConsumers() {
  const consumers = [registerExchangeRateConsumer(observability.reporter)];

  await Promise.all(consumers).catch(observability.reporter.report);
}
