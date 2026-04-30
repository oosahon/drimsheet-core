import { DomainError, TErrorCause } from '../../../shared/errors/error';

type TErrorKeyPrefix = `ledger_error_${string}`;

const ELedgerError = {
  ControlAccountNotFound: `ledger_error_control_account_not_found`,
} as const satisfies Record<string, TErrorKeyPrefix>;

type ULedgerError = (typeof ELedgerError)[keyof typeof ELedgerError];

class LedgerError extends DomainError<ULedgerError> {
  constructor(key: ULedgerError, cause?: TErrorCause) {
    super(key, key, cause);
  }
}

class ControlAccountNotFound extends LedgerError {
  constructor(cause?: TErrorCause) {
    super(ELedgerError.ControlAccountNotFound, cause);
  }
}

const ledgerError = Object.freeze({
  Error: LedgerError,
  ControlAccountNotFound,
});

export default ledgerError;
