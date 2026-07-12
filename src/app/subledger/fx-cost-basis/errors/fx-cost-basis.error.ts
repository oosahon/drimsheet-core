import { TErrorCause } from '../../../../shared/types/error.types';
import errorUtils from '../../../../shared/utils/error';
import appError from '../../../shared/errors/app.error';

type TErrorKeyPrefix = `app_error_fx_cost_basis_${string}`;

const EErrorKeys = {
  NotSupported: 'app_error_fx_cost_basis_not_supported',
  UnsupportedAccount: 'app_error_fx_cost_basis_unsupported_account',
  MissingAcquisitionRate: 'app_error_fx_cost_basis_missing_acquisition_rate',
  UnsupportedEntry: 'app_error_fx_cost_basis_unsupported_entry',
  MalformedAcquisition: 'app_error_fx_cost_basis_malformed_acquisition',
} as const satisfies Record<string, TErrorKeyPrefix>;

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
