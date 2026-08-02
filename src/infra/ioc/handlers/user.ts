import makeUserEmailVerifiedEventHandler from '../../../app/user/handlers/user-email-verified-event.handler';
import { EUserEvents } from '../../../domain/user/events/user.events';
import observability from '../../observability';
import appContext from '../../runtime/app-context';

export const userEmailVerifiedEventHandler = makeUserEmailVerifiedEventHandler({
  reporter: observability.reporter,
  appContext: appContext,
});

const userEventsRegistry = {
  [EUserEvents.EmailVerified]: userEmailVerifiedEventHandler,
};

export { userEventsRegistry };
