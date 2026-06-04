import { accountingEntityEventsRegistry } from '../accounting/handlers';
import { journalEntryEventsRegistry } from '../bookkeeping/handlers';
import { ledgerAccountEventsRegistry } from '../ledger/handlers';
import IEventBus from '../shared/contracts/event-bus.contract';
import { userEventsRegistry } from '../user/handlers';

export default function eventsRegistry(eventBus: IEventBus) {
  const events = {
    ...accountingEntityEventsRegistry,
    ...userEventsRegistry,
    ...ledgerAccountEventsRegistry,
    ...journalEntryEventsRegistry,
  };

  Object.entries(events).forEach(([eventType, handler]) => {
    eventBus.subscribe(eventType, handler);
  });
}
