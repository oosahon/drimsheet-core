import eventValue from '@shared/values/events/event.vo';

import { IFxCostBasisLot } from '@domain/subledger/fx-cost-basis/types/lot.types';

export const EFxCostBasisLotEvent = {
  Created: 'domain:subledger:fx-lot:created',
  Disposed: 'domain:subledger:fx-lot:disposed',
  Reversed: 'domain:subledger:fx-lot:reversed',
} as const;

export type UFxCostBasisLotEvent =
  (typeof EFxCostBasisLotEvent)[keyof typeof EFxCostBasisLotEvent];

function makeCreatedEvent(payload: IFxCostBasisLot) {
  return eventValue.make<IFxCostBasisLot>({
    type: EFxCostBasisLotEvent.Created,
    data: payload,
  });
}

function makeDisposedEvent(payload: IFxCostBasisLot) {
  return eventValue.make<IFxCostBasisLot>({
    type: EFxCostBasisLotEvent.Disposed,
    data: payload,
  });
}

function makeReversedEvent(payload: IFxCostBasisLot) {
  return eventValue.make<IFxCostBasisLot>({
    type: EFxCostBasisLotEvent.Reversed,
    data: payload,
  });
}

const FxCostBasisLotEvents = Object.freeze({
  created: makeCreatedEvent,
  disposed: makeDisposedEvent,
  reversed: makeReversedEvent,
});

export default FxCostBasisLotEvents;
