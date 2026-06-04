import eventBus from '../../infra/messaging/event-bus';
import registerWorkers from '../../infra/messaging/workers';
import observability from '../../infra/observability';
import repos from '../../infra/persistence/repos';
import setupServer from '../../infra/server';
import services from '../../infra/services';
import { bootstrapAccountingContext } from './accounting-context.bootstrap';
import eventsRegistry from './events.bootstrap';
import bootstrapCurrencies from './setup-currencies.bootstrap';

async function bootstraper() {
  try {
    await bootstrapCurrencies(repos.currency, observability.logger);
    await bootstrapAccountingContext(
      observability.logger,
      repos.accountingStandards,
      repos.jurisdiction,
      repos.jurisdictionAccountingStandard,
      services.repo
    );

    registerWorkers(observability.reporter);
    eventsRegistry(eventBus);
  } catch (error) {
    observability.logger.error(error, 'Failed to bootstrap');
    observability.reporter.report(error);
    process.exit(1);
  }
}

function main() {
  setupServer(bootstraper);
}

main();
