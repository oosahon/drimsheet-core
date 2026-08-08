import eventValue from '@shared/values/events/event.vo';

import { IAccountingContext } from '@domain/accounting/types/context.types';

export const EAccountingContextEvents = {
  Created: 'domain:accounting:context:created',
} as const;

function makeCreatedEvent(params: IAccountingContext) {
  return eventValue.make<IAccountingContext>({
    type: EAccountingContextEvents.Created,
    data: params,
  });
}

const accountingContextEvents = Object.freeze({
  created: makeCreatedEvent,
});

export default accountingContextEvents;
