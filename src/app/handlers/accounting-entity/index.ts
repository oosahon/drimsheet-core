import observability from '../../../infra/observability';
import appContext from '../../context';
import accountingEntityCreatedEventHandler from './accounting-entity-created-event.handler';

const accountingEntityEventHandlers = {
  created: accountingEntityCreatedEventHandler(
    observability.reporter,
    appContext.request
  ),
};

export default accountingEntityEventHandlers;
