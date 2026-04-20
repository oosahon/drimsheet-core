import eventValue from '../../../shared/value-objects/event.vo';
import { IJournalLineItem } from '../types/journal-entry.types';

export const EJournalLineItemEvent = {
  Created: 'domain:journal-line-item:created',
} as const;

export type UJournalLineItemEvent =
  (typeof EJournalLineItemEvent)[keyof typeof EJournalLineItemEvent];

export const journalLineItemEventDescriptions: Record<string, string> = {
  [EJournalLineItemEvent.Created]: 'Created a new journal line item.',
};

function makeJournalLineItemCreatedEvent(payload: IJournalLineItem) {
  return eventValue.make<IJournalLineItem>({
    type: EJournalLineItemEvent.Created,
    data: payload,
  });
}

const journalLineItemEvents = Object.freeze({
  created: makeJournalLineItemCreatedEvent,
});

export default journalLineItemEvents;
