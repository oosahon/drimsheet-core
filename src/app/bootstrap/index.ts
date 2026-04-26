import eventBus from '../../infra/messaging/event-bus';
import registerWorkers from '../../infra/messaging/workers';
import observability from '../../infra/observability';
import repos from '../../infra/persistence/repos';
import setupServer from '../../infra/server';
import eventsRegistry from '../event-registry';
import bootstrapCurrencies from './setup-currencies';

async function bootstrap() {
  await bootstrapCurrencies(repos.currency, observability.logger);

  const serverCallback = async () => {
    registerWorkers(observability.reporter);
    eventsRegistry(eventBus);
  };

  setupServer(serverCallback);
}

bootstrap();
