import eventValue from '@shared/values/events/event.vo';

import { IFxCostBasisLotAcquisition } from '@domain/subledger/fx-cost-basis/types/acquisition.types';

export const EFxCostBasisLotAcquisitionEvent = {
  Created: 'domain:subledger:fx-lot-acquisition:created',
} as const;

export type UFxCostBasisLotAcquisitionEvent =
  (typeof EFxCostBasisLotAcquisitionEvent)[keyof typeof EFxCostBasisLotAcquisitionEvent];

function makeCreatedEvent(payload: IFxCostBasisLotAcquisition) {
  return eventValue.make<IFxCostBasisLotAcquisition>({
    type: EFxCostBasisLotAcquisitionEvent.Created,
    data: payload,
  });
}

const FxCostBasisLotAcquisitionEvents = Object.freeze({
  created: makeCreatedEvent,
});

export default FxCostBasisLotAcquisitionEvents;
