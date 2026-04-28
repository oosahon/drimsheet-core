import { EAccountingEntityEvents } from '../../../domain/accounting/events/accounting-entity.events';
import { IAccountingEntity } from '../../../domain/accounting/types/accounting-entity.types';
import { IEvent } from '../../../shared/types/event.types';
import IRequestContext from '../../contracts/app/request-context.contract';
import IReporter from '../../contracts/infra/reporter.contract';
import userUseCase from '../../usecases/user';
import validateEventAndSetRequestContext from '../shared/validate-and-set-request-context';

export default function makeAccountingEntityCreatedEventHandler(
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

      await userUseCase
        .saveActivity(event.data.ownerId, event)
        .catch(reporter.report);
    } catch (error) {
      reporter.report(error);
    }
  };
}
