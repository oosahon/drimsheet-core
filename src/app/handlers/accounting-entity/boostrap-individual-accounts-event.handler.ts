import { EAccountingEntityEvents } from '../../../domain/accounting-entity/events/accounting-entity.events';
import { IAccountingEntity } from '../../../domain/accounting-entity/types/accounting-entity.types';
import { IEvent } from '../../../shared/types/event.types';
import IRequestContext from '../../contracts/app/request-context.contract';
import IReporter from '../../contracts/infra/reporter.contract';
import accountingEntityUsecase from '../../usecases/accounting-entity';
import validateEventAndSetRequestContext from '../shared/validate-and-set-request-context';

export default function bootstrapIndividualAccountEntityPostingAccountsHandler(
  reporter: IReporter,
  requestContext: IRequestContext
) {
  return async (event: IEvent<IAccountingEntity>) => {
    try {
      validateEventAndSetRequestContext(
        requestContext,
        event,
        EAccountingEntityEvents.BootstrapIndividualPostingAccounts
      );

      accountingEntityUsecase
        .setupNonPowerUserPostingAccounts(event.data.id)
        .catch(reporter.report);
    } catch (error) {
      reporter.report(error);
    }
  };
}
