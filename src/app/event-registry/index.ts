import IEventBus from '../contracts/infra/event-bus.contract';
import { accountingEntityEventsRegistry } from '../handlers/accounting-entity';
import { ledgerAccountEventsRegistry } from '../handlers/ledger';
import { userEventsRegistry } from '../handlers/user';

export default function eventsRegistry(eventBus: IEventBus) {
  const events = {
    ...accountingEntityEventsRegistry,
    ...userEventsRegistry,
    ...ledgerAccountEventsRegistry,
  };

  Object.entries(events).forEach(([eventType, handler]) => {
    eventBus.subscribe(eventType, handler);
  });
}
