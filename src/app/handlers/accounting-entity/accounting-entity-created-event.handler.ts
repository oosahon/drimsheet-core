import { IEvent } from '../../../shared/types/event.types';
import IReporter from '../../contracts/infra/reporter.contract';
import { IAccountingEntity } from '../../../domain/accounting/types/accounting.types';
import { EAccountingEntityEvents } from '../../../domain/accounting/events/accounting-entity.events';
import IRequestContext from '../../contracts/app/request-context.contract';
import ledgerAccountUsecase from '../../usecases/ledger-account';
import validateEventAndSetRequestContext from '../shared/validate-and-set-request-context';
import userUseCase from '../../usecases/user';

export default function accountingEntityCreatedEventHandler(
  reporter: IReporter,
  requestContext: IRequestContext
) {
  return async (event: IEvent<IAccountingEntity>) => {
    try {
      validateEventAndSetRequestContext(
        requestContext,
        event,
        EAccountingEntityEvents.Created
      );

      userUseCase
        .saveActivity(event.data.ownerId, event)
        .catch(reporter.report);

      ledgerAccountUsecase
        .setupIndividualEntityBaseAccounts(event.data.id)
        .catch(reporter.report);
    } catch (error) {
      reporter.report(error);
    }
  };
}
