import appContext from '../../../app/shared/context';
import makeUserCreatedEventHandler from '../../../app/user/handlers/user-created-event.handler';
import makeUserEmailVerifiedEventHandler from '../../../app/user/handlers/user-email-verified-event.handler';
import { EUserEvents } from '../../../domain/user/events/user.events';
import observability from '../../observability';
import authUseCase from '../auth/usecases';

const userEventHandlers = {
  created: makeUserCreatedEventHandler({
    reporter: observability.reporter,
    requestContext: appContext.request,
    sendEmailVerificationEmail: authUseCase.sendEmailVerificationEmail,
  }),

  emailVerified: makeUserEmailVerifiedEventHandler({
    reporter: observability.reporter,
    requestContext: appContext.request,
  }),
};

const userEventsRegistry = {
  [EUserEvents.Created]: userEventHandlers.created,
  [EUserEvents.EmailVerified]: userEventHandlers.emailVerified,
};

export { userEventsRegistry };
