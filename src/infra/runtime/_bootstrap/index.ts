import registerWorkers from '@infra/messaging/workers';
import setupServer from '@infra/server';

import { bootstrapAccountingContext } from './accounting-context.bootstrap';
import eventsRegistry from './events.bootstrap';
import bootstrapFeatureFlags from './feature-flag.bootstrap';
import registerRabbitMQConsumers from './rabbit-mq-consumers.bootstrap';
import bootstrapCurrencies from './setup-currencies.bootstrap';

async function bootstraper() {
  await bootstrapFeatureFlags();
  await bootstrapCurrencies();
  await bootstrapAccountingContext();
  registerWorkers();
  eventsRegistry();
  await registerRabbitMQConsumers();
}

function main() {
  setupServer(bootstraper);
}

main();
