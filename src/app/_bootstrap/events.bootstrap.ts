import messaging from '../../infra/messaging';
import { accountingEntityEventsRegistry } from '../accounting/handlers';
import { journalEntryEventsRegistry } from '../bookkeeping/handlers';
import { ledgerAccountEventsRegistry } from '../ledger/handlers';
import { userEventsRegistry } from '../user/handlers';

export default function eventsRegistry() {
  const events = {
    ...accountingEntityEventsRegistry,
    ...userEventsRegistry,
    ...ledgerAccountEventsRegistry,
    ...journalEntryEventsRegistry,
  };

  Object.entries(events).forEach(([eventType, handler]) => {
    messaging.eventBus.subscribe(eventType, handler);
  });
}
