import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import DomainError from '@shared/values/errors/domain.error';

const EErrorKeys = {
  InvalidCreatedBy:
    'fx_cost_basis_lot_disposition_allocation_created_by_invalid',
  InvalidDispositionId:
    'fx_cost_basis_lot_disposition_allocation_disposition_id_invalid',
  InvalidLotId: 'fx_cost_basis_lot_disposition_allocation_lot_id_invalid',
  InvalidQuantity: 'fx_cost_basis_lot_disposition_allocation_quantity_invalid',
  InvalidCostBasisConsumed:
    'fx_cost_basis_lot_disposition_allocation_cost_basis_consumed_invalid',
  InvalidProceeds: 'fx_cost_basis_lot_disposition_allocation_proceeds_invalid',
  MismatchedFunctionalCurrency:
    'fx_cost_basis_lot_disposition_allocation_functional_currency_mismatched_invalid',
  InvalidRealizedGainLossFormula:
    'fx_cost_basis_lot_disposition_allocation_realized_gain_loss_formula_invalid',
} as const satisfies TErrorKeys<'fx_cost_basis_lot_disposition_allocation'>;

type UError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class FxCostBasisLotDispositionAllocationError extends DomainError<UError> {
  constructor(key: UError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'FxCostBasisLotDispositionAllocationError';
  }
}

const fxCostBasisLotDispositionAllocationError = Object.freeze({
  Base: FxCostBasisLotDispositionAllocationError,
  ...errorUtils.getMappedErrors(
    EErrorKeys,
    FxCostBasisLotDispositionAllocationError
  ),
});

export default fxCostBasisLotDispositionAllocationError;
