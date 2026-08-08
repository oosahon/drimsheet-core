import eventValue from '@shared/values/events/event.vo';

import { IEmployer } from '@domain/counterparty/types/counterparty.types';

export const EEmployerEvents = {
  Created: 'domain:counterparty:employer:created',
  Updated: 'domain:counterparty:employer:updated',
} as const;

function makeCreatedEvent(employer: IEmployer) {
  return eventValue.make<IEmployer>({
    type: EEmployerEvents.Created,
    data: employer,
  });
}

function makeUpdatedEvent(employer: IEmployer) {
  return eventValue.make<IEmployer>({
    type: EEmployerEvents.Updated,
    data: employer,
  });
}

const employerEvents = Object.freeze({
  created: makeCreatedEvent,
  updated: makeUpdatedEvent,
});

export default employerEvents;
