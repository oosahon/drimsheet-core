import eventValue from '@shared/values/events/event.vo';

import { IFxCostBasisLotDisposition } from '@domain/subledger/fx-cost-basis/types/disposition.types';

export const EFxCostBasisLotDispositionEvent = {
  Created: 'domain:subledger:fx-lot-disposition:created',
} as const;

export type UFxCostBasisLotDispositionEvent =
  (typeof EFxCostBasisLotDispositionEvent)[keyof typeof EFxCostBasisLotDispositionEvent];

function makeCreatedEvent(payload: IFxCostBasisLotDisposition) {
  return eventValue.make<IFxCostBasisLotDisposition>({
    type: EFxCostBasisLotDispositionEvent.Created,
    data: payload,
  });
}

const FxCostBasisLotDispositionEvents = Object.freeze({
  created: makeCreatedEvent,
});

export default FxCostBasisLotDispositionEvents;
