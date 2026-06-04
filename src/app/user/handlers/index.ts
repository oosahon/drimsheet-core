import { EUserEvents } from '../../../domain/user/events/user.events';
import observability from '../../../infra/observability';
import appContext from '../../shared/context';
import makeUserPasswordResetEventHandler from './password-reset-event.handler';
import makeUserPasswordResetRequestedHandler from './password-reset-requested-event.handler';
import makeUserCreatedEventHandler from './user-created-event.handler';
import makeUserEmailVerifiedEventHandler from './user-email-verified-event.handler';
import makeUserLoggedInEventHandler from './user-logged-in-event.handler';

const userEventHandlers = {
  created: makeUserCreatedEventHandler(
    observability.reporter,
    appContext.request
  ),

  emailVerified: makeUserEmailVerifiedEventHandler(
    observability.reporter,
    appContext.request
  ),
  loggedIn: makeUserLoggedInEventHandler(
    observability.reporter,
    appContext.request
  ),
  passwordResetRequested: makeUserPasswordResetRequestedHandler(
    observability.reporter,
    appContext.request
  ),
  passwordReset: makeUserPasswordResetEventHandler(
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
