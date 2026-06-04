import { EAccountingEntityEvents } from '../../../domain/accounting/events/accounting-entity.events';
import { IAccountingEntity } from '../../../domain/accounting/types/accounting-entity.types';
import { IEvent } from '../../../shared/types/event.types';
import IReporter from '../../shared/contracts/reporter.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import validateEventAndSetRequestContext from '../../shared/handlers/validate-and-set-request-context';
import userUseCase from '../../user/usecases';

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
