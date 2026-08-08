import eventValue from '@shared/values/events/event.vo';

import { IContractor } from '@domain/counterparty/types/counterparty.types';

export const EContractorEvents = {
  Created: 'domain:counterparty:contractor:created',
  Updated: 'domain:counterparty:contractor:updated',
} as const;

function makeCreatedEvent(contractor: IContractor) {
  return eventValue.make<IContractor>({
    type: EContractorEvents.Created,
    data: contractor,
  });
}

function makeUpdatedEvent(contractor: IContractor) {
  return eventValue.make<IContractor>({
    type: EContractorEvents.Updated,
    data: contractor,
  });
}

const contractorEvents = Object.freeze({
  created: makeCreatedEvent,
  updated: makeUpdatedEvent,
});

export default contractorEvents;
