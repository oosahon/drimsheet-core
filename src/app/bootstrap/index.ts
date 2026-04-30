import eventBus from '../../infra/messaging/event-bus';
import registerWorkers from '../../infra/messaging/workers';
import observability from '../../infra/observability';
import repos from '../../infra/persistence/repos';
import setupServer from '../../infra/server';
import services from '../../infra/services';
import eventsRegistry from '../event-registry';
import { bootstrapAccountingContext } from './accounting-context';
import bootstrapCurrencies from './setup-currencies';

async function bootstrap() {
  try {
    await bootstrapCurrencies(repos.currency, observability.logger);
    await bootstrapAccountingContext(
      observability.logger,
      repos.accountingStandards,
      repos.jurisdiction,
      repos.jurisdictionAccountingStandard,
      services.repo
    );

    const serverCallback = async () => {
      registerWorkers(observability.reporter);
      eventsRegistry(eventBus);
    };

    setupServer(serverCallback);
  } catch (error) {
    observability.logger.error(error, 'Failed to bootstrap');
    observability.reporter.report(error);
    process.exit(1);
  }
}

bootstrap();
