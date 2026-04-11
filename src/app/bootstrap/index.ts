import eventBus from '../../infra/messaging/event-bus';
import registerWorkers from '../../infra/messaging/jobs/workers';
import logger from '../../infra/observability/logger';
import repos from '../../infra/persistence/repos';
import setupServer from '../../infra/server';
import eventsRegistry from '../event-registry';
import bootstrapCurrencies from './setup-currencies';

async function bootstrap() {
  await bootstrapCurrencies(repos.currency, logger);

  const serverCallback = async () => {
    registerWorkers();
    eventsRegistry(eventBus);
  };

  setupServer(serverCallback);
}

bootstrap();
