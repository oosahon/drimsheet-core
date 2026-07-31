import { TErrorCause } from '../../../../shared/types/error.types';
import errorUtils from '../../../../shared/utils/error';
import DomainError from '../../../../shared/values/errors/domain.error';

type TErrorPrefix = `ledger_error_${string}`;

const EErrorKeys = {
  InvalidValue: 'ledger_error_invalid_value',
  InvalidId: 'ledger_error_invalid_id',
  InvalidAction: 'ledger_error_invalid_action',
  InvalidDate: 'ledger_error_invalid_date',
} as const satisfies Record<string, TErrorPrefix>;

type ULedgerError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class LedgerError<
  K extends TErrorPrefix = ULedgerError,
> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'LedgerError';
  }
}

const ledgerError = Object.freeze({
  Base: LedgerError,
  ...errorUtils.getMappedErrors(EErrorKeys, LedgerError),
});

export default ledgerError;
