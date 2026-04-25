import IEventBus from '../contracts/infra/event-bus.contract';
import { accountingEntityEventsRegistry } from '../handlers/accounting-entity';
import { journalEntryEventsRegistry } from '../handlers/journal-entry';
import { ledgerAccountEventsRegistry } from '../handlers/ledger';
import { userEventsRegistry } from '../handlers/user';

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
