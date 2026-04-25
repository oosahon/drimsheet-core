import { ELedgerAccountEvent } from '../../../domain/ledger/events/ledger-account.events';
import observability from '../../../infra/observability';
import appContext from '../../context';
import makeLedgerAccountCreatedEventHandler from './ledger-account-created-event.handler';

export const ledgerAccountHandlers = {
  ledgerAccountCreated: makeLedgerAccountCreatedEventHandler(
    observability.reporter,
    appContext.request
  ),
};

export const ledgerAccountEventsRegistry = {
  [ELedgerAccountEvent.Created]: ledgerAccountHandlers.ledgerAccountCreated,
};
