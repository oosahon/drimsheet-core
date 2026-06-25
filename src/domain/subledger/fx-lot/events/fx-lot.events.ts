import eventValue from '../../../../shared/value-objects/event.vo';
import { IFxLot } from '../types/fx-lot.types';

export const EFxLotEvent = {
  Created: 'domain:subledger:fx-lot:created',
} as const;

export type UFxLotEvent = (typeof EFxLotEvent)[keyof typeof EFxLotEvent];

function makeCreatedEvent(payload: IFxLot) {
  return eventValue.make<IFxLot>({
    type: EFxLotEvent.Created,
    data: payload,
  });
}

const fxLotEvents = Object.freeze({
  created: makeCreatedEvent,
});

export default fxLotEvents;
