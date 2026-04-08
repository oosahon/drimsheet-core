import { EUserEvents } from '../../../domain/user/events/user.events';
import observability from '../../../infra/observability';
import appContext from '../../context';
import emailVerifiedEventHandler from './email-verified-event.handler';
import userCreatedEventHandler from './user-created-event.handler';

const userEventHandlers = {
  created: userCreatedEventHandler(
    observability.reporter,
    observability.logger,
    appContext.request
  ),

  emailVerified: emailVerifiedEventHandler(
    observability.reporter,
    appContext.request
  ),
};

const userEventsRegistry = {
  [EUserEvents.Created]: userEventHandlers.created,
  [EUserEvents.EmailVerified]: userEventHandlers.emailVerified,
};

export { userEventsRegistry };
