import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import appError from '@shared/values/errors/app.error';

const EErrorKeys = {
  NotSupported: 'app_error_fx_cost_basis_not_supported_invalid',
  UnsupportedAccount: 'app_error_fx_cost_basis_unsupported_account_invalid',
  MissingAcquisitionRate:
    'app_error_fx_cost_basis_missing_acquisition_rate_invalid',
  UnsupportedEntry: 'app_error_fx_cost_basis_unsupported_entry_invalid',
} as const satisfies TErrorKeys<'app_error_fx_cost_basis'>;

type ULedgerError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class FxCostBasisAppError extends appError.Base<ULedgerError> {
  constructor(key: ULedgerError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'FxCostBasisAppError';
  }
}

const fxCostBasisAppError = Object.freeze({
  Base: FxCostBasisAppError,
  ...errorUtils.getMappedErrors(EErrorKeys, FxCostBasisAppError),
});

export default fxCostBasisAppError;
