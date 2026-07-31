import eventValue from '../../../shared/values/events/event.vo';
import { IJournalEntry } from '../types/journal-entry.types';

export const EJournalEntryEvent = {
  Created: 'domain:journal-entry:created',
} as const;

export type UJournalEntryEvent =
  (typeof EJournalEntryEvent)[keyof typeof EJournalEntryEvent];

function makeJournalEntryCreatedEvent(payload: IJournalEntry) {
  return eventValue.make<IJournalEntry>({
    type: EJournalEntryEvent.Created,
    data: payload,
  });
}

const journalEntryEvents = Object.freeze({
  created: makeJournalEntryCreatedEvent,
});

export default journalEntryEvents;
