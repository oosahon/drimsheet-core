import { ELedgerAccountEvent } from '../../../domain/ledger/events/ledger-account.events';
import { ILedgerAccount } from '../../../domain/ledger/types/ledger.types';
import IReporter from '../../../shared/contracts/reporter.contract';
import IRequestContext from '../../../shared/contracts/request-context.contract';
import { IEvent } from '../../../shared/types/event.types';
import validateEventAndSetRequestContext from '../../shared/helpers/validate-and-set-request-context';
import ledgerUseCases from '../usecases';

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

      const createBalance = ledgerUseCases
        .createLedgerAccountBalance(event.data)
        .catch(reporter.report);

      await Promise.all([createBalance]);
    } catch (error) {
      reporter.report(error);
    }
  };
}
