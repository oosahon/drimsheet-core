import eventValue from '../../../../shared/events/event.vo';
import { IFxCostBasisLot } from '../types/lot.types';

export const EFxCostBasisLotEvent = {
  Created: 'domain:subledger:fx-lot:created',
} as const;

export type UFxCostBasisLotEvent =
  (typeof EFxCostBasisLotEvent)[keyof typeof EFxCostBasisLotEvent];

function makeCreatedEvent(payload: IFxCostBasisLot) {
  return eventValue.make<IFxCostBasisLot>({
    type: EFxCostBasisLotEvent.Created,
    data: payload,
  });
}

const FxCostBasisLotEvents = Object.freeze({
  created: makeCreatedEvent,
});

export default FxCostBasisLotEvents;
