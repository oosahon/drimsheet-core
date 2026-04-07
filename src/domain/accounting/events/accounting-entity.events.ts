import eventValue from '../../../shared/value-objects/event.vo';
import { IAccountingEntity } from '../types/accounting.types';

export const EAccountingEntityEvents = {
  Created: 'domain:accounting:entity:created',
} as const;

function makeCreatedEvent(params: IAccountingEntity) {
  return eventValue.make<IAccountingEntity>({
    type: EAccountingEntityEvents.Created,
    data: params,
  });
}

const accountingEntityTypeEvents = Object.freeze({
  created: makeCreatedEvent,
});

export default accountingEntityTypeEvents;
