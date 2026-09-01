import { TCreationOmits } from '@shared/types/creation-omits.types';
import stringUtils from '@shared/utils/string';
import generateUUID from '@shared/utils/uuid-generator';

import helpers from '@domain/subledger/fx-cost-basis/entities/helpers/disposition-allocation.entity.helpers';
import fxCostBasisLotDispositionAllocationError from '@domain/subledger/fx-cost-basis/errors/disposition-allocation.error';
import { IFxCostBasisLotDispositionAllocation } from '@domain/subledger/fx-cost-basis/types/disposition.types';

function make(
  payload: TCreationOmits<IFxCostBasisLotDispositionAllocation>
): IFxCostBasisLotDispositionAllocation {
  stringUtils.validateUUID(
    payload.dispositionId,
    fxCostBasisLotDispositionAllocationError.InvalidDispositionId
  );
  stringUtils.validateUUID(
    payload.lotId,
    fxCostBasisLotDispositionAllocationError.InvalidLotId
  );

  helpers.validateQuantity(payload.quantity);
  helpers.validateCostBasisConsumed(payload.costBasisConsumed);
  helpers.validateProceeds(payload.proceeds);
  helpers.validateFunctionalCurrency(payload);
  helpers.validateRealizedGainLossFormula(payload);

  return Object.freeze({
    id: generateUUID(),
    dispositionId: payload.dispositionId,
    lotId: payload.lotId,
    quantity: payload.quantity,
    costBasisConsumed: payload.costBasisConsumed,
    proceeds: payload.proceeds,
    realizedGainLoss: payload.realizedGainLoss,
    createdAt: new Date(),
  });
}

const fxCostBasisLotDispositionAllocationEntity = Object.freeze({
  make,

  ...helpers,
});

export default fxCostBasisLotDispositionAllocationEntity;
