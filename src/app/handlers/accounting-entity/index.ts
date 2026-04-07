import messaging from '../../../infra/messaging';
import observability from '../../../infra/observability';
import repos from '../../../infra/persistence/repos';
import appContext from '../../context';
import accountingEntityCreatedEventHandler from './accounting-entity-created-event.handler';

const accountingEntityEventHandlers = {
  created: accountingEntityCreatedEventHandler(
    observability.reporter,
    repos.ledgerAccount,
    appContext.request,
    repos.accountingEntity,
    messaging.eventBus
  ),
};

export default accountingEntityEventHandlers;
