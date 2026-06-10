import registerWorkers from '../../infra/messaging/workers';
import observability from '../../infra/observability';
import setupServer from '../../infra/server';
import { bootstrapAccountingContext } from './accounting-context.bootstrap';
import eventsRegistry from './events.bootstrap';
import registerRabbitMQConsumers from './rabbit-mq-consumers.bootstrap';
import bootstrapCurrencies from './setup-currencies.bootstrap';

async function bootstraper() {
  try {
    await bootstrapCurrencies();
    await bootstrapAccountingContext();
    registerWorkers();
    eventsRegistry();
    await registerRabbitMQConsumers();
  } catch (error) {
    observability.reporter.report(error);
    process.exit(1);
  }
}

function main() {
  setupServer(bootstraper);
}

main();
