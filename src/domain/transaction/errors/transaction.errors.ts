import { TransactionError } from '.';
import { getMappedErrors, TErrorCause } from '../../../shared/errors/error';

type TErrorKeyPrefix = `transaction_error_transaction_${string}`;

const EErrorKeys = {
  InvalidReference: 'transaction_error_transaction_invalid_reference',
  InvalidType: 'transaction_error_transaction_invalid_type',
  InvalidStatus: 'transaction_error_transaction_invalid_status',
  InvalidAttachment: 'transaction_error_transaction_invalid_attachment',
  InvalidAttachments: 'transaction_error_transaction_invalid_attachments',
  MissingCounterpartyId:
    'transaction_error_transaction_missing_counterparty_id',
  InsufficientTransactionItems:
    'transaction_error_transaction_insufficient_transaction_items',
} as const satisfies Record<string, TErrorKeyPrefix>;

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
