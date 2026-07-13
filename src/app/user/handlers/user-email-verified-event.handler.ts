import { EUserEvents } from '../../../domain/user/events/user.events';
import { IUser } from '../../../domain/user/types/user.types';
import IAppContext from '../../../shared/contracts/app-context.contract';
import IReporter from '../../../shared/contracts/reporter.contract';
import { IEvent } from '../../../shared/types/event.types';
import validateEventAndSetAppContext from '../../../shared/utils/validate-and-set-app-context';

interface IDependencies {
  reporter: IReporter;
  appContext: IAppContext;
}

function makeUserEmailVerifiedEventHandler(deps: IDependencies) {
  return async (event: IEvent<IUser>) => {
    validateEventAndSetAppContext(
      deps.appContext,
      event,
      EUserEvents.EmailVerified
    );

    // TODO: send welcome email https://linear.app/purpleledger/issue/PUR-20/create-and-send-welcome-emails
  };
}

export default makeUserEmailVerifiedEventHandler;
