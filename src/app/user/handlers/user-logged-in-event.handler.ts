import { EUserEvents } from '../../../domain/user/events/user.events';
import { IUser } from '../../../domain/user/types/user.types';
import { IEvent } from '../../../shared/types/event.types';
import IReporter from '../../shared/contracts/reporter.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import validateEventAndSetRequestContext from '../../shared/handlers/validate-and-set-request-context';
import userUseCase from '../../user/usecases';

export default function makeUserLoggedInEventHandler(
  reporter: IReporter,
  requestContext: IRequestContext
) {
  return async (event: IEvent<IUser>) => {
    try {
      validateEventAndSetRequestContext(
        requestContext,
        event,
        EUserEvents.LoggedIn
      );

      await userUseCase
        .saveActivity(event.data.id, event)
        .catch(reporter.report);
    } catch (error) {
      reporter.report(error);
    }
  };
}
