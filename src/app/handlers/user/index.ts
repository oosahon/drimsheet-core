import { EUserEvents } from '../../../domain/user/events/user.events';
import observability from '../../../infra/observability';
import appContext from '../../context';
import userPasswordResetEventHandler from './password-reset-event.handler';
import userPasswordResetRequestedHandler from './password-reset-requested-event.handler';
import userCreatedEventHandler from './user-created-event.handler';
import userEmailVerifiedEventHandler from './user-email-verified-event.handler';
import userLoggedInEventHandler from './user-logged-in-event.handler';

const userEventHandlers = {
  created: userCreatedEventHandler(observability.reporter, appContext.request),

  emailVerified: userEmailVerifiedEventHandler(
    observability.reporter,
    appContext.request
  ),
  loggedIn: userLoggedInEventHandler(
    observability.reporter,
    appContext.request
  ),
  passwordResetRequested: userPasswordResetRequestedHandler(
    observability.reporter,
    appContext.request
  ),
  passwordReset: userPasswordResetEventHandler(
    observability.reporter,
    appContext.request
  ),
};

const userEventsRegistry = {
  [EUserEvents.Created]: userEventHandlers.created,
  [EUserEvents.EmailVerified]: userEventHandlers.emailVerified,
  [EUserEvents.LoggedIn]: userEventHandlers.loggedIn,
  [EUserEvents.RequestedPasswordReset]:
    userEventHandlers.passwordResetRequested,
  [EUserEvents.PasswordReset]: userEventHandlers.passwordReset,
};

export { userEventsRegistry };
