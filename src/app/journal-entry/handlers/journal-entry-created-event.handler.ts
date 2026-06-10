import { EJournalEntryEvent } from '../../../domain/journal-entry/events/journal-entry.events';
import { IJournalEntry } from '../../../domain/journal-entry/types/journal-entry.types';
import { IEvent } from '../../../shared/types/event.types';
import IReporter from '../../shared/contracts/reporter.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import validateEventAndSetRequestContext from '../../shared/helpers/validate-and-set-request-context';
import journalEntryUseCases from '../usecases';

export default function makeJournalEntryCreatedEventHandler(
  reporter: IReporter,
  requestContext: IRequestContext
) {
  return async (event: IEvent<IJournalEntry>) => {
    try {
      validateEventAndSetRequestContext(
        requestContext,
        event,
        EJournalEntryEvent.Created
      );

      const enqueueBalanceAdjustment = journalEntryUseCases
        .enqueueBalanceAdjustment(event.data)
        .catch(reporter.report);

      await Promise.all([enqueueBalanceAdjustment]);
    } catch (error) {
      reporter.report(error);
    }
  };
}
