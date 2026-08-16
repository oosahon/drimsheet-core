import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import DomainError from '@shared/values/errors/domain.error';

const EErrorKeys = {
  InvalidLedgerAccountId:
    'fx_cost_basis_lot_disposition_ledger_account_id_invalid',
  InvalidAccountingEntityId:
    'fx_cost_basis_lot_disposition_accounting_entity_id_invalid',
  InvalidJournalEntryId:
    'fx_cost_basis_lot_disposition_journal_entry_id_invalid',
  InvalidQuantity: 'fx_cost_basis_lot_disposition_quantity_invalid',
  InvalidCostBasisConsumed:
    'fx_cost_basis_lot_disposition_cost_basis_consumed_invalid',
  InvalidProceeds: 'fx_cost_basis_lot_disposition_proceeds_invalid',
  InvalidRealizedGainLoss:
    'fx_cost_basis_lot_disposition_realized_gain_loss_invalid',
  InvalidDispositionDate:
    'fx_cost_basis_lot_disposition_disposition_date_invalid',
  InvalidDispositionRate:
    'fx_cost_basis_lot_disposition_disposition_rate_invalid',
} as const satisfies TErrorKeys<'fx_cost_basis_lot_disposition'>;

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
