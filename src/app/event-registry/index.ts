import IEventBus from '../contracts/infra/event-bus.contract';
import accountingEntityEventsRegistry from './accounting-entity-events.registry';

export default function eventsRegistry(eventBus: IEventBus) {
  const events = {
    ...accountingEntityEventsRegistry,
  };

  Object.entries(events).forEach(([eventType, handler]) => {
    eventBus.subscribe(eventType, handler);
  });
}
