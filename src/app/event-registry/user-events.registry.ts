import { EUserEvents } from '../../domain/user/events/user.events';
import userEventHandlers from '../handlers/user';

const userEventsRegistry = {
  [EUserEvents.Created]: userEventHandlers.created,
};

export default userEventsRegistry;
