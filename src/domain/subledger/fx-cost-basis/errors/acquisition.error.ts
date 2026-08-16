import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import DomainError from '@shared/values/errors/domain.error';

const EErrorKeys = {
  InvalidLedgerAccountId:
    'fx_cost_basis_lot_acquisition_ledger_account_id_invalid',
  InvalidAccountingEntityId:
    'fx_cost_basis_lot_acquisition_accounting_entity_id_invalid',
  InvalidLotId: 'fx_cost_basis_lot_acquisition_lot_id_invalid',
  InvalidJournalEntryId:
    'fx_cost_basis_lot_acquisition_journal_entry_id_invalid',
  InvalidQuantity: 'fx_cost_basis_lot_acquisition_quantity_invalid',
  InvalidCostBasis: 'fx_cost_basis_lot_acquisition_cost_basis_invalid',
  InvalidAcquisitionDate:
    'fx_cost_basis_lot_acquisition_acquisition_date_invalid',
} as const satisfies TErrorKeys<'fx_cost_basis_lot_acquisition'>;

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
