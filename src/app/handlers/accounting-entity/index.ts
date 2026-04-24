import { EAccountingEntityEvents } from '../../../domain/accounting-entity/events/accounting-entity.events';
import observability from '../../../infra/observability';
import appContext from '../../context';
import makeAccountingEntityCreatedEventHandler from './accounting-entity-created-event.handler';
import makeBootstrapIndividualAccountEntityPostingAccountsHandler from './bootstrap-individual-accounts-event.handler';

export const accountingEntityEventHandlers = {
  created: makeAccountingEntityCreatedEventHandler(
    observability.reporter,
    appContext.request
  ),
  bootstrapIndividualPostingAccounts:
    makeBootstrapIndividualAccountEntityPostingAccountsHandler(
      observability.reporter,
      appContext.request
    ),
};

export const accountingEntityEventsRegistry = {
  [EAccountingEntityEvents.Created]: accountingEntityEventHandlers.created,
  [EAccountingEntityEvents.BootstrapIndividualPostingAccounts]:
    accountingEntityEventHandlers.bootstrapIndividualPostingAccounts,
};
