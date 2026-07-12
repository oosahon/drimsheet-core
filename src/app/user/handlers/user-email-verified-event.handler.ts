import { EUserEvents } from '../../../domain/user/events/user.events';
import { IUser } from '../../../domain/user/types/user.types';
import IReporter from '../../../shared/contracts/reporter.contract';
import { IEvent } from '../../../shared/types/event.types';
import IRequestContext from '../../shared/contracts/request-context.contract';
import validateEventAndSetRequestContext from '../../shared/helpers/validate-and-set-request-context';

interface IDependencies {
  reporter: IReporter;
  requestContext: IRequestContext;
}

function makeUserEmailVerifiedEventHandler(deps: IDependencies) {
  return async (event: IEvent<IUser>) => {
    validateEventAndSetRequestContext(
      deps.requestContext,
      event,
      EUserEvents.EmailVerified
    );

    // TODO: send welcome email https://linear.app/purpleledger/issue/PUR-20/create-and-send-welcome-emails
  };
}

export default makeUserEmailVerifiedEventHandler;
