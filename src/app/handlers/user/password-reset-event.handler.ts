import { EUserEvents } from '../../../domain/user/events/user.events';
import { IUser } from '../../../domain/user/types/user.types';
import { IEvent } from '../../../shared/types/event.types';
import IRequestContext from '../../contracts/app/request-context.contract';
import IReporter from '../../contracts/infra/reporter.contract';
import userUseCase from '../../usecases/user';
import validateEventAndSetRequestContext from '../shared/validate-and-set-request-context';

export default function userPasswordResetEventHandler(
  reporter: IReporter,
  requestContext: IRequestContext
) {
  return async (event: IEvent<IUser>) => {
    try {
      validateEventAndSetRequestContext(
        requestContext,
        event,
        EUserEvents.PasswordReset
      );

      await userUseCase
        .saveActivity(event.data.id, event)
        .catch(reporter.report);
    } catch (error) {
      reporter.report(error);
    }
  };
}
