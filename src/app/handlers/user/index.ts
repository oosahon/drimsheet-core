import { EUserEvents } from '../../../domain/user/events/user.events';
import observability from '../../../infra/observability';
import appContext from '../../context';
import userCreatedEventHandler from './user-created-event.handler';
import userEmailVerifiedEventHandler from './user-email-verified-event.handler';

const userEventHandlers = {
  created: userCreatedEventHandler(observability.reporter, appContext.request),

  emailVerified: userEmailVerifiedEventHandler(
    observability.reporter,
    appContext.request
  ),
};

const userEventsRegistry = {
  [EUserEvents.Created]: userEventHandlers.created,
  [EUserEvents.EmailVerified]: userEventHandlers.emailVerified,
};

export { userEventsRegistry };
