import DomainError from '../../../../shared/errors/domain.error';
import { TErrorCause } from '../../../../shared/types/error.types';
import errorUtils from '../../../../shared/utils/error';

type TErrorKeyPrefix = `fx_lot_error_${string}`;

const EErrorKeys = {
  InvalidLedgerAccountId: 'fx_lot_error_invalid_ledger_account_id',
  InvalidAccountingEntityId: 'fx_lot_error_invalid_accounting_entity_id',
  InvalidStatus: 'fx_lot_error_invalid_status',
  InvalidOriginalQuantity: 'fx_lot_error_invalid_original_quantity',
  InvalidRemainingQuantity: 'fx_lot_error_invalid_remaining_quantity',
  InvalidCostBasis: 'fx_lot_error_invalid_cost_basis',
  InvalidRemainingCostBasis: 'fx_lot_error_invalid_remaining_cost_basis',
  MismatchedQuantityCurrency: 'fx_lot_error_mismatched_quantity_currency',
  MismatchedCostBasisCurrency: 'fx_lot_error_mismatched_cost_basis_currency',
  ExcessRemainingQuantity: 'fx_lot_error_excess_remaining_quantity',
  ExcessRemainingCostBasis: 'fx_lot_error_excess_remaining_cost_basis',
  InvalidAcquisitionRate: 'fx_lot_error_invalid_acquisition_rate',
  InvalidAcquisitionDate: 'fx_lot_error_invalid_acquisition_date',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UFxLotError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class FxLotError extends DomainError<UFxLotError> {
  constructor(key: UFxLotError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'FxLotError';
  }
}

const fxLotError = Object.freeze({
  Base: FxLotError,
  ...errorUtils.getMappedErrors(EErrorKeys, FxLotError),
});

export default fxLotError;
