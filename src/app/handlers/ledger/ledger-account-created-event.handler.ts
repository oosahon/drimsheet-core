import { ELedgerAccountEvent } from '../../../domain/ledger/events/ledger-account.events';
import { ILedgerAccount } from '../../../domain/ledger/types/ledger.types';
import { IEvent } from '../../../shared/types/event.types';
import IRequestContext from '../../contracts/app/request-context.contract';
import IReporter from '../../contracts/infra/reporter.contract';
import accountingUsecases from '../../usecases/accounting';
import validateEventAndSetRequestContext from '../shared/validate-and-set-request-context';

export default function makeLedgerAccountCreatedEventHandler(
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

      const createBalance = accountingUsecases
        .createLedgerAccountBalance(event.data)
        .catch(reporter.report);

      // TODO: create a 1:1 category map for the ledger account

      await Promise.all([createBalance]);
    } catch (error) {
      reporter.report(error);
    }
  };
}
