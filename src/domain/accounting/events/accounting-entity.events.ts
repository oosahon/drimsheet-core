import eventValue from '../../../shared/value-objects/event.vo';
import { IAccountingEntity } from '../types/accounting.types';

export enum EAccountingEntityEvents {
  Created = 'domain:accounting:entity:created',
}

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
