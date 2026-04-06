import repos from '../../infra/persistence/repos';
import logger from '../../infra/observability/logger';
import setupServer from '../../infra/server';
import bootstrapCurrencies from './setup-currencies';
import eventsRegistry from '../event-registry';
import eventBus from '../../infra/messaging/event-bus';

async function bootstrap() {
  await bootstrapCurrencies(repos.currency, logger);

  const serverCallback = async () => {
    eventsRegistry(eventBus);
  };

  setupServer(serverCallback);
}

bootstrap();
