import observability from '../../../infra/observability';
import repos from '../../../infra/persistence/repos';
import services from '../../../infra/services';
import accountingEntityCreatedEventHandler from './accounting-entity-created-event.handler';

const accountingEntityEventHandlers = {
  created: accountingEntityCreatedEventHandler(
    observability.reporter,
    repos.ledgerAccount,
    services.repo
  ),
};

export default accountingEntityEventHandlers;
