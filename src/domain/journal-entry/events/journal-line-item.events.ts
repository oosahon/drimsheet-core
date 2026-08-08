import eventValue from '@shared/values/events/event.vo';

import { IJournalLine } from '@domain/journal-entry/types/journal-line.types';

export const EJournalLineItemEvent = {
  Created: 'domain:journal-line-item:created',
} as const;

export type UJournalLineItemEvent =
  (typeof EJournalLineItemEvent)[keyof typeof EJournalLineItemEvent];

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
