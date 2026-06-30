import DomainError from '../../../../shared/errors/domain.error';
import { TErrorCause } from '../../../../shared/types/error.types';
import errorUtils from '../../../../shared/utils/error';

type TErrorKeyPrefix = `fx_cost_basis_lot_error_${string}`;

const EErrorKeys = {
  InvalidLedgerAccountId: 'fx_cost_basis_lot_error_invalid_ledger_account_id',
  InvalidAccountingEntityId:
    'fx_cost_basis_lot_error_invalid_accounting_entity_id',
  InvalidStatus: 'fx_cost_basis_lot_error_invalid_status',
  InvalidOriginalQuantity: 'fx_cost_basis_lot_error_invalid_original_quantity',
  InvalidRemainingQuantity:
    'fx_cost_basis_lot_error_invalid_remaining_quantity',
  InvalidCostBasis: 'fx_cost_basis_lot_error_invalid_cost_basis',
  InvalidRemainingCostBasis:
    'fx_cost_basis_lot_error_invalid_remaining_cost_basis',
  MismatchedQuantityCurrency:
    'fx_cost_basis_lot_error_mismatched_quantity_currency',
  MismatchedCostBasisCurrency:
    'fx_cost_basis_lot_error_mismatched_cost_basis_currency',
  ExcessRemainingQuantity: 'fx_cost_basis_lot_error_excess_remaining_quantity',
  ExcessRemainingCostBasis:
    'fx_cost_basis_lot_error_excess_remaining_cost_basis',
  InvalidAcquisitionRate: 'fx_cost_basis_lot_error_invalid_acquisition_rate',
  InvalidAcquisitionDate: 'fx_cost_basis_lot_error_invalid_acquisition_date',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UFxCostBasisLotError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class FxCostBasisLotError extends DomainError<UFxCostBasisLotError> {
  constructor(key: UFxCostBasisLotError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'fxCostBasisLotError';
  }
}

const fxCostBasisLotError = Object.freeze({
  Base: FxCostBasisLotError,
  ...errorUtils.getMappedErrors(EErrorKeys, FxCostBasisLotError),
});

export default fxCostBasisLotError;
