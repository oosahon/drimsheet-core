import DomainError from '../../../../shared/errors/domain.error';
import { TErrorCause } from '../../../../shared/types/error.types';
import errorUtils from '../../../../shared/utils/error';

type TErrorKeyPrefix = `fx_cost_basis_lot_acquisition_${string}`;

const EErrorKeys = {
  InvalidLedgerAccountId:
    'fx_cost_basis_lot_acquisition_invalid_ledger_account_id',
  InvalidAccountingEntityId:
    'fx_cost_basis_lot_acquisition_invalid_accounting_entity_id',
  InvalidLotId: 'fx_cost_basis_lot_acquisition_invalid_lot_id',
  InvalidJournalEntryId:
    'fx_cost_basis_lot_acquisition_invalid_journal_entry_id',
  InvalidQuantity: 'fx_cost_basis_lot_acquisition_invalid_quantity',
  InvalidCostBasis: 'fx_cost_basis_lot_acquisition_invalid_cost_basis',
  InvalidAcquisitionDate:
    'fx_cost_basis_lot_acquisition_invalid_acquisition_date',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UFxCostBasisLotAcquisitionError =
  (typeof EErrorKeys)[keyof typeof EErrorKeys];

class FxCostBasisLotAcquisitionError extends DomainError<UFxCostBasisLotAcquisitionError> {
  constructor(key: UFxCostBasisLotAcquisitionError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'FxCostBasisLotAcquisitionError';
  }
}

const fxCostBasisLotAcquisitionError = Object.freeze({
  Base: FxCostBasisLotAcquisitionError,
  ...errorUtils.getMappedErrors(EErrorKeys, FxCostBasisLotAcquisitionError),
});

export default fxCostBasisLotAcquisitionError;
