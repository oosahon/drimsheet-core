import { getMappedErrors, TErrorCause } from '../../../shared/utils/error';
import { SubledgerError } from './subledger.error';

type TErrorKeyPrefix = `subledger_error_currency_lot_subledger_${string}`;

const EErrorKeys = {
  InvalidAdjustmentType:
    'subledger_error_currency_lot_subledger_invalid_adjustment_type',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UCurrencyLotSubledgerError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class CurrencyLotSubledgerError extends SubledgerError<UCurrencyLotSubledgerError> {
  constructor(key: UCurrencyLotSubledgerError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const currencyLotSubledgerError = Object.freeze({
  Error: CurrencyLotSubledgerError,
  ...getMappedErrors(EErrorKeys, CurrencyLotSubledgerError),
});

export default currencyLotSubledgerError;
