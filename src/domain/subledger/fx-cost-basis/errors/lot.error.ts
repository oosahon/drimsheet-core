import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import DomainError from '@shared/values/errors/domain.error';

const EErrorKeys = {
  InvalidLedgerAccountId: 'fx_cost_basis_lot_error_ledger_account_id_invalid',
  InvalidAccountingEntityId:
    'fx_cost_basis_lot_error_accounting_entity_id_invalid',
  InvalidStatus: 'fx_cost_basis_lot_error_status_invalid',
  InvalidOriginalQuantity: 'fx_cost_basis_lot_error_original_quantity_invalid',
  InvalidRemainingQuantity:
    'fx_cost_basis_lot_error_remaining_quantity_invalid',
  InvalidCostBasis: 'fx_cost_basis_lot_error_cost_basis_invalid',
  InvalidRemainingCostBasis:
    'fx_cost_basis_lot_error_remaining_cost_basis_invalid',
  MismatchedQuantityCurrency:
    'fx_cost_basis_lot_error_mismatched_quantity_currency_invalid',
  MismatchedCostBasisCurrency:
    'fx_cost_basis_lot_error_mismatched_cost_basis_currency_invalid',
  ExcessRemainingQuantity:
    'fx_cost_basis_lot_error_excess_remaining_quantity_invalid',
  ExcessRemainingCostBasis:
    'fx_cost_basis_lot_error_excess_remaining_cost_basis_invalid',
  InvalidAcquisitionRate: 'fx_cost_basis_lot_error_acquisition_rate_invalid',
  InvalidAcquisitionDate: 'fx_cost_basis_lot_error_acquisition_date_invalid',
} as const satisfies TErrorKeys<'fx_cost_basis_lot_error'>;

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
