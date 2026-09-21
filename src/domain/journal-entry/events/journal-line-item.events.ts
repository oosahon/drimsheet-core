import eventValue from '@shared/values/events/event.vo';

import { IJournalLine } from '@domain/journal-entry/types/journal-line.types';

export const EJournalLineItemEvent = {
  Created: 'domain:journal-line-item:created',
  Updated: 'domain:journal-line-item:updated',
} as const;

export type UJournalLineItemEvent =
  (typeof EJournalLineItemEvent)[keyof typeof EJournalLineItemEvent];

function makeJournalLineItemCreatedEvent(payload: IJournalLine) {
  return eventValue.make<IJournalLine>({
    type: EJournalLineItemEvent.Created,
    data: payload,
  });
}

function makeJournalLineItemUpdatedEvent(payload: IJournalLine) {
  return eventValue.make<IJournalLine>({
    type: EJournalLineItemEvent.Updated,
    data: payload,
  });
}

const journalLineEvents = Object.freeze({
  created: makeJournalLineItemCreatedEvent,
  updated: makeJournalLineItemUpdatedEvent,
});

export default journalLineEvents;
