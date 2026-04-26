import { EJournalEntryEvent } from '../../../domain/journal-entry/events/journal-entry.events';
import observability from '../../../infra/observability';
import appContext from '../../context';
import makeJournalEntryCreatedEventHandler from './journal-entry-created-event.handler';

export const journalEntryHandlers = {
  journalEntryCreated: makeJournalEntryCreatedEventHandler(
    observability.reporter,
    appContext.request
  ),
};

export const journalEntryEventsRegistry = {
  [EJournalEntryEvent.Created]: journalEntryHandlers.journalEntryCreated,
};
