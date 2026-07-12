import { EUserEvents } from '../../../domain/user/events/user.events';
import observability from '../../../infra/observability';
import appContext from '../../shared/context';
import makeUserCreatedEventHandler from './user-created-event.handler';
import makeUserEmailVerifiedEventHandler from './user-email-verified-event.handler';

const userEventHandlers = {
  created: makeUserCreatedEventHandler({
    reporter: observability.reporter,
    requestContext: appContext.request,
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
