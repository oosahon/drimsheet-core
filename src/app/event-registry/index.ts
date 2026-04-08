import IEventBus from '../contracts/infra/event-bus.contract';
import { userEventsRegistry } from '../handlers/user';
import { accountingEntityEventsRegistry } from '../handlers/accounting-entity';

export default function eventsRegistry(eventBus: IEventBus) {
  const events = {
    ...accountingEntityEventsRegistry,
    ...userEventsRegistry,
  };

  Object.entries(events).forEach(([eventType, handler]) => {
    eventBus.subscribe(eventType, handler);
  });
}
