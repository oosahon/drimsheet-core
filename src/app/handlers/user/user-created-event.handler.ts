import { EUserEvents } from '../../../domain/user/events/user.events';
import { IUser } from '../../../domain/user/types/user.types';
import { IEvent } from '../../../shared/types/event.types';
import eventValue from '../../../shared/value-objects/event.vo';
import ILogger from '../../contracts/infra/logger.contract';
import IReporter from '../../contracts/infra/reporter.contract';
import authUseCase from '../../usecases/auth';

export default function userCreatedEventHandler(
  reporter: IReporter,
  logger: ILogger
) {
  return async (event: IEvent<IUser>) => {
    try {
      eventValue.validateEventTypeMatch(event, EUserEvents.Created);

      const shouldSendEmailVerification = !event.data.emailVerified;

      if (shouldSendEmailVerification) {
        await authUseCase.sendEmailVerificationEmail(event.data.email);
      } else {
        // TODO: send welcome email
      }
    } catch (error) {
      logger.error(error);
      reporter.report(error);
    }
  };
}
