import eventValue from '../../../shared/events/event.vo';
import { IAccountingContext } from '../types/context.types';

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
