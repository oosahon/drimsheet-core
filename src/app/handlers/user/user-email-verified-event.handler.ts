import IReporter from '../../contracts/infra/reporter.contract';
import { IEvent } from '../../../shared/types/event.types';
import { IUser } from '../../../domain/user/types/user.types';
import userUseCase from '../../usecases/user';
import validateEventAndSetRequestContext from '../shared/validate-and-set-request-context';
import { EUserEvents } from '../../../domain/user/events/user.events';
import IRequestContext from '../../contracts/app/request-context.contract';

function userEmailVerifiedEventHandler(
  reporter: IReporter,
  requestContext: IRequestContext
) {
  return async (event: IEvent<IUser>) => {
    validateEventAndSetRequestContext(
      requestContext,
      event,
      EUserEvents.EmailVerified
    );

    await userUseCase.saveActivity(event.data.id, event).catch(reporter.report);

    // TODO: send welcome email https://linear.app/purpleledger/issue/PUR-20/create-and-send-welcome-emails
  };
}

export default userEmailVerifiedEventHandler;
