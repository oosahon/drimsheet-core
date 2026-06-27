import DomainError from '../../../../shared/errors/domain.error';
import { TErrorCause } from '../../../../shared/types/error.types';
import errorUtils from '../../../../shared/utils/error';

type TErrorKeyPrefix = `fx_cost_basis_lot_disposition_${string}`;

const EErrorKeys = {
  InvalidLedgerAccountId:
    'fx_cost_basis_lot_disposition_invalid_ledger_account_id',
  InvalidAccountingEntityId:
    'fx_cost_basis_lot_disposition_invalid_accounting_entity_id',
  InvalidJournalEntryId:
    'fx_cost_basis_lot_disposition_invalid_journal_entry_id',
  InvalidQuantity: 'fx_cost_basis_lot_disposition_invalid_quantity',
  InvalidCostBasisConsumed:
    'fx_cost_basis_lot_disposition_invalid_cost_basis_consumed',
  InvalidProceeds: 'fx_cost_basis_lot_disposition_invalid_proceeds',
  InvalidRealizedGainLoss:
    'fx_cost_basis_lot_disposition_invalid_realized_gain_loss',
  InvalidDispositionDate:
    'fx_cost_basis_lot_disposition_invalid_disposition_date',
  InvalidDispositionRate:
    'fx_cost_basis_lot_disposition_invalid_disposition_rate',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UFxCostBasisLotDispositionError =
  (typeof EErrorKeys)[keyof typeof EErrorKeys];

class FxCostBasisLotDispositionError extends DomainError<UFxCostBasisLotDispositionError> {
  constructor(key: UFxCostBasisLotDispositionError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'FxCostBasisLotDispositionError';
  }
}

const fxCostBasisLotDispositionError = Object.freeze({
  Base: FxCostBasisLotDispositionError,
  ...errorUtils.getMappedErrors(EErrorKeys, FxCostBasisLotDispositionError),
});

export default fxCostBasisLotDispositionError;
