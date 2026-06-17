import messaging from '../../infra/messaging';
import { journalEntryEventsRegistry } from '../journal-entry/handlers';
import { ledgerAccountEventsRegistry } from '../ledger/handlers';
import { userEventsRegistry } from '../user/handlers';

export default function eventsRegistry() {
  const events = {
    ...userEventsRegistry,
    ...ledgerAccountEventsRegistry,
    ...journalEntryEventsRegistry,
  };

  Object.entries(events).forEach(([eventType, handler]) => {
    messaging.eventBus.subscribe(eventType, handler);
  });
}
