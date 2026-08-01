import { EUserEvents } from '../../../domain/user/events/user.events';
import { IUser } from '../../../domain/user/types/user.types';
import IReporter from '../../../shared/contracts/reporter.contract';
import { IEvent } from '../../../shared/values/events/types/event.types';
import IAppContext from '../../context/contracts/app-context.contract';
import validateEventAndSetAppContext from '../../context/helpers/validate-and-set-app-context';

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
