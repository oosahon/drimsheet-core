import { ELedgerAccountEvent } from '../../../domain/ledger/events/ledger-account.events';
import { ILedgerAccount } from '../../../domain/ledger/types/ledger.types';
import { IEvent } from '../../../shared/types/event.types';
import IRequestContext from '../../contracts/app/request-context.contract';
import IReporter from '../../contracts/infra/reporter.contract';
import validateEventAndSetRequestContext from '../shared/validate-and-set-request-context';

export default function handleLedgerAccountCreatedEvent(
  reporter: IReporter,
  requestContext: IRequestContext
) {
  return async (event: IEvent<ILedgerAccount>) => {
    try {
      validateEventAndSetRequestContext(
        requestContext,
        event,
        ELedgerAccountEvent.Created
      );

      // TODO: create a 1:1 category map for the ledger account
    } catch (error) {
      reporter.report(error);
    }
  };
}
