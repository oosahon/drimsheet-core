import eventValue from '@shared/values/events/event.vo';

import { ICounterparty } from '@domain/counterparty/types/counterparty.types';

export const ECounterpartyEvents = {
  Created: 'domain:counterparty:created',
  RoleAdded: 'domain:counterparty:role-added',
} as const;

function makeCreatedEvent(counterparty: ICounterparty) {
  return eventValue.make<ICounterparty>({
    type: ECounterpartyEvents.Created,
    data: counterparty,
  });
}

function makeRoleAddedEvent(counterparty: ICounterparty) {
  return eventValue.make<ICounterparty>({
    type: ECounterpartyEvents.RoleAdded,
    data: counterparty,
  });
}

const counterpartyEvents = Object.freeze({
  created: makeCreatedEvent,
  roleAdded: makeRoleAddedEvent,
});

export default counterpartyEvents;
