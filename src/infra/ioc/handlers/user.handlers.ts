import makeUserCreatedEventHandler from '../../../app/user/handlers/user-created-event.handler';
import makeUserEmailVerifiedEventHandler from '../../../app/user/handlers/user-email-verified-event.handler';
import { EUserEvents } from '../../../domain/user/events/user.events';
import observability from '../../observability';
import appContext from '../../runtime/app-context';
import authUseCase from '../usecases/auth.usecases';

const userEventHandlers = {
  created: makeUserCreatedEventHandler({
    reporter: observability.reporter,
    appContext: appContext,
    sendEmailVerificationEmail: authUseCase.sendEmailVerificationEmail,
  }),

  emailVerified: makeUserEmailVerifiedEventHandler({
    reporter: observability.reporter,
    appContext: appContext,
  }),
};

const userEventsRegistry = {
  [EUserEvents.Created]: userEventHandlers.created,
  [EUserEvents.EmailVerified]: userEventHandlers.emailVerified,
};

export { userEventsRegistry };
