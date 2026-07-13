import { EUserEvents } from '../../../domain/user/events/user.events';
import { IUser } from '../../../domain/user/types/user.types';
import IReporter from '../../../shared/contracts/reporter.contract';
import { IEvent } from '../../../shared/events/types/event.types';
import IAppContext from '../../_internal/contracts/app-context.contract';
import validateEventAndSetAppContext from '../../_internal/helpers/validate-and-set-app-context';

interface IDependencies {
  reporter: IReporter;
  appContext: IAppContext;
  sendEmailVerificationEmail: (email: string) => Promise<void>;
}

export default function makeUserCreatedEventHandler(deps: IDependencies) {
  return async (event: IEvent<IUser>) => {
    try {
      validateEventAndSetAppContext(
        deps.appContext,
        event,
        EUserEvents.Created
      );

      const shouldSendEmailVerification = !event.data.emailVerified;

      if (shouldSendEmailVerification) {
        await deps
          .sendEmailVerificationEmail(event.data.email)
          .catch(deps.reporter.report);
      } else {
        // TODO: send welcome email https://linear.app/purpleledger/issue/PUR-20/create-and-send-welcome-emails
      }
    } catch (error) {
      deps.reporter.report(error);
    }
  };
}
