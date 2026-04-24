import eventValue from '../../../shared/value-objects/event.vo';
import { IJournalLine } from '../types/journal-line.types';

export const EJournalLineItemEvent = {
  Created: 'domain:journal-line-item:created',
} as const;

export type UJournalLineItemEvent =
  (typeof EJournalLineItemEvent)[keyof typeof EJournalLineItemEvent];

export const journalLineEventDescriptions: Record<string, string> = {
  [EJournalLineItemEvent.Created]: 'Created a new journal line item.',
};

function makeJournalLineItemCreatedEvent(payload: IJournalLine) {
  return eventValue.make<IJournalLine>({
    type: EJournalLineItemEvent.Created,
    data: payload,
  });
}

const journalLineEvents = Object.freeze({
  created: makeJournalLineItemCreatedEvent,
});

export default journalLineEvents;
