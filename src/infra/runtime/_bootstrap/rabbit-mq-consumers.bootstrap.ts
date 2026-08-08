import registerExchangeRateConsumer from '@infra/messaging/external/exchange-rate.consumer';
import observability from '@infra/observability';

export default async function registerRabbitMQConsumers() {
  const consumers = [registerExchangeRateConsumer(observability.reporter)];

  await Promise.all(consumers).catch(observability.reporter.report);
}
