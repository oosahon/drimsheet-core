import DomainError from '../../../../shared/errors/domain.error';
import { TErrorCause } from '../../../../shared/types/error.types';
import errorUtils from '../../../../shared/utils/error';

type TErrorKeyPrefix = `fx_lot_acquisition_${string}`;

const EErrorKeys = {
  InvalidLedgerAccountId: 'fx_lot_acquisition_invalid_ledger_account_id',
  InvalidAccountingEntityId: 'fx_lot_acquisition_invalid_accounting_entity_id',
  InvalidLotId: 'fx_lot_acquisition_invalid_lot_id',
  InvalidJournalEntryId: 'fx_lot_acquisition_invalid_journal_entry_id',
  InvalidQuantity: 'fx_lot_acquisition_invalid_quantity',
  InvalidCostBasis: 'fx_lot_acquisition_invalid_cost_basis',
  InvalidOfficialRateId: 'fx_lot_acquisition_invalid_official_rate_id',
  MismatchedOfficialRate: 'fx_lot_acquisition_mismatched_official_rate',
  InvalidAcquisitionDate: 'fx_lot_acquisition_invalid_acquisition_date',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UFxLotAcquisitionError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class FxLotAcquisitionError extends DomainError<UFxLotAcquisitionError> {
  constructor(key: UFxLotAcquisitionError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'FxLotAcquisitionError';
  }
}

const fxLotAcquisitionError = Object.freeze({
  Base: FxLotAcquisitionError,
  ...errorUtils.getMappedErrors(EErrorKeys, FxLotAcquisitionError),
});

export default fxLotAcquisitionError;
