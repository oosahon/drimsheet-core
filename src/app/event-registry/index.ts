import IEventBus from '../contracts/infra/event-bus.contract';
import { accountingEntityEventsRegistry } from '../handlers/accounting-entity';
import { userEventsRegistry } from '../handlers/user';

export default function eventsRegistry(eventBus: IEventBus) {
  const events = {
    ...accountingEntityEventsRegistry,
    ...userEventsRegistry,
  };

  Object.entries(events).forEach(([eventType, handler]) => {
    eventBus.subscribe(eventType, handler);
  });
}
