import { EUserEvents } from '../../../domain/user/events/user.events';
import { IUser } from '../../../domain/user/types/user.types';
import { IEvent } from '../../../shared/types/event.types';
import authUseCase from '../../auth/usecases';
import IReporter from '../../shared/contracts/reporter.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import validateEventAndSetRequestContext from '../../shared/helpers/validate-and-set-request-context';

export default function makeUserCreatedEventHandler(
  reporter: IReporter,
  requestContext: IRequestContext
) {
  return async (event: IEvent<IUser>) => {
    try {
      validateEventAndSetRequestContext(
        requestContext,
        event,
        EUserEvents.Created
      );

      const shouldSendEmailVerification = !event.data.emailVerified;

      if (shouldSendEmailVerification) {
        await authUseCase
          .sendEmailVerificationEmail(event.data.email)
          .catch(reporter.report);
      } else {
        // TODO: send welcome email https://linear.app/purpleledger/issue/PUR-20/create-and-send-welcome-emails
      }
    } catch (error) {
      reporter.report(error);
    }
  };
}
