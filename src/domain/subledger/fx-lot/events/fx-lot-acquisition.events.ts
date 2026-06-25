import eventValue from '../../../../shared/value-objects/event.vo';
import { IFxLotAcquisition } from '../types/fx-lot.types';

export const EFxLotAcquisitionEvent = {
  Created: 'domain:subledger:fx-lot-acquisition:created',
} as const;

export type UFxLotAcquisitionEvent =
  (typeof EFxLotAcquisitionEvent)[keyof typeof EFxLotAcquisitionEvent];

function makeCreatedEvent(payload: IFxLotAcquisition) {
  return eventValue.make<IFxLotAcquisition>({
    type: EFxLotAcquisitionEvent.Created,
    data: payload,
  });
}

const fxLotAcquisitionEvents = Object.freeze({
  created: makeCreatedEvent,
});

export default fxLotAcquisitionEvents;
