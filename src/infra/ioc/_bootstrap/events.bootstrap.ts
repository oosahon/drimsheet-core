import messaging from '../../messaging';

import { userEventsRegistry } from '../handlers/user.handlers';

export default function eventsRegistry() {
  const events = {
    ...userEventsRegistry,
  };

  Object.entries(events).forEach(([eventType, handler]) => {
    messaging.eventBus.subscribe(eventType, handler);
  });
}
