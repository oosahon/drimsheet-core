import { EAccountingEntityEvents } from '../../../domain/accounting/events/accounting-entity.events';
import observability from '../../../infra/observability';
import appContext from '../../context';
import accountingEntityCreatedEventHandler from './accounting-entity-created-event.handler';

export const accountingEntityEventHandlers = {
  created: accountingEntityCreatedEventHandler(
    observability.reporter,
    appContext.request
  ),
};

export const accountingEntityEventsRegistry = {
  [EAccountingEntityEvents.Created]: accountingEntityEventHandlers.created,
};
