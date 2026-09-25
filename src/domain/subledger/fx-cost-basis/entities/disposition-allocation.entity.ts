import { TCreationOmits } from '@shared/types/creation-omits.types';
import stringUtils from '@shared/utils/string';
import generateUUID from '@shared/utils/uuid-generator';

import dispositionAllocationValidation from '@domain/subledger/fx-cost-basis/entities/validations/disposition-allocation.validation';
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

  dispositionAllocationValidation.validateQuantity(payload.quantity);
  dispositionAllocationValidation.validateCostBasisConsumed(
    payload.costBasisConsumed
  );
  dispositionAllocationValidation.validateProceeds(payload.proceeds);
  dispositionAllocationValidation.validateFunctionalCurrency(payload);
  dispositionAllocationValidation.validateRealizedGainLossFormula(payload);

  stringUtils.validateUUID(
    payload.createdBy,
    fxCostBasisLotDispositionAllocationError.InvalidCreatedBy
  );

  return Object.freeze({
    id: generateUUID(),
    createdBy: payload.createdBy,
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
  ...dispositionAllocationValidation,
});

export default fxCostBasisLotDispositionAllocationEntity;
