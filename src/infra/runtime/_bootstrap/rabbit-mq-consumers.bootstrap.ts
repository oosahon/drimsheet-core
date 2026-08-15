import registerExchangeRateConsumer from '@infra/messaging/external/exchange-rate.consumer';
import observability from '@infra/observability';
import appContext from '@infra/runtime/app-context';

export default async function registerRabbitMQConsumers() {
  const consumers = [
    registerExchangeRateConsumer(observability.reporter, appContext),
  ];

  await Promise.all(consumers).catch((error) =>
    observability.reporter.report('event.subscription.failed', error, {
      subscriber: 'rabbitmq',
    })
  );
}
