import { EUserEvents } from '../../../domain/user/events/user.events';
import { IUser } from '../../../domain/user/types/user.types';
import { IEvent } from '../../../shared/types/event.types';
import IReporter from '../../shared/contracts/reporter.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import validateEventAndSetRequestContext from '../../shared/helpers/validate-and-set-request-context';

function makeUserEmailVerifiedEventHandler(
  reporter: IReporter,
  requestContext: IRequestContext
) {
  return async (event: IEvent<IUser>) => {
    validateEventAndSetRequestContext(
      requestContext,
      event,
      EUserEvents.EmailVerified
    );

    // TODO: send welcome email https://linear.app/purpleledger/issue/PUR-20/create-and-send-welcome-emails
  };
}

export default makeUserEmailVerifiedEventHandler;
