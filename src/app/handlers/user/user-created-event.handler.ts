import { EUserEvents } from '../../../domain/user/events/user.events';
import { IUser } from '../../../domain/user/types/user.types';
import { IEvent } from '../../../shared/types/event.types';
import IRequestContext from '../../contracts/app/request-context.contract';
import ILogger from '../../contracts/infra/logger.contract';
import IReporter from '../../contracts/infra/reporter.contract';
import authUseCase from '../../usecases/auth';
import userUseCase from '../../usecases/user';
import validateEventAndSetRequestContext from '../helpers/validate-and-set-request-context';

export default function userCreatedEventHandler(
  reporter: IReporter,
  logger: ILogger,
  requestContext: IRequestContext
) {
  return async (event: IEvent<IUser>) => {
    try {
      validateEventAndSetRequestContext(
        requestContext,
        event,
        EUserEvents.Created
      );

      userUseCase.saveActivity(event.data.id, event).catch(reporter.report);

      const shouldSendEmailVerification = !event.data.emailVerified;

      if (shouldSendEmailVerification) {
        authUseCase
          .sendEmailVerificationEmail(event.data.email)
          .catch(reporter.report);
      } else {
        // TODO: send welcome email
      }
    } catch (error) {
      logger.error(error);
      reporter.report(error);
    }
  };
}
