import DomainError from '../../../shared/errors/domain.error';
import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';

type TErrorPrefix = `transaction_error_${string}`;

class TransactionError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
  }
}

const EErrorKeys = {
  InvalidValue: 'transaction_error_invalid_value',
  InvalidReference: 'transaction_error_invalid_reference',
  InvalidType: 'transaction_error_invalid_type',
  InvalidStatus: 'transaction_error_invalid_status',
  InvalidAttachment: 'transaction_error_invalid_attachment',
  InvalidAttachments: 'transaction_error_invalid_attachments',
  MissingCounterpartyId: 'transaction_error_missing_counterparty_id',
  InsufficientTransactionItems:
    'transaction_error_insufficient_transaction_items',
  CounterpartyIdNotAllowed: 'transaction_error_counterparty_id_not_allowed',
} as const satisfies Record<string, TErrorPrefix>;

const transactionError = Object.freeze({
  Base: TransactionError,
  ...errorUtils.getMappedErrors(EErrorKeys, TransactionError),
});

export default transactionError;
