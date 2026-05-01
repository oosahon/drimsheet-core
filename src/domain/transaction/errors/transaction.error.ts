import {
  DomainError,
  getMappedErrors,
  TErrorCause,
} from '../../../shared/utils/error';

type TErrorPrefix = `transaction_error_${string}`;

export class TransactionError<K extends TErrorPrefix> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
  }
}

const EErrorKeys = {
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

type USpecificTransactionError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class SpecificTransactionError extends TransactionError<USpecificTransactionError> {
  constructor(key: USpecificTransactionError, cause?: TErrorCause) {
    super(key, cause);
  }
}

const transactionError = Object.freeze({
  Error: SpecificTransactionError,
  ...getMappedErrors(EErrorKeys, SpecificTransactionError),
});

export default transactionError;
