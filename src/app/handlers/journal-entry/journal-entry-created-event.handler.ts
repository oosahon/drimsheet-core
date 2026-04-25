import { EJournalEntryEvent } from '../../../domain/journal-entry/events/journal-entry.events';
import { IJournalEntry } from '../../../domain/journal-entry/types/journal-entry.types';
import { IEvent } from '../../../shared/types/event.types';
import IRequestContext from '../../contracts/app/request-context.contract';
import IReporter from '../../contracts/infra/reporter.contract';
import accountingUsecases from '../../usecases/accounting';
import validateEventAndSetRequestContext from '../shared/validate-and-set-request-context';

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

      const adjustBalance = accountingUsecases
        .adjustBalanceAfterJournalEntry(event.data)
        .catch(reporter.report);

      await Promise.all([adjustBalance]);
    } catch (error) {
      reporter.report(error);
    }
  };
}
