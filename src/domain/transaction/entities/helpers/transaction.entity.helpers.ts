import { TEntityId } from '../../../../shared/types/uuid';
import stringUtils from '../../../../shared/utils/string';
import transactionError from '../../errors/transaction.errors';
import {
  ETransactionStatus,
  ETransactionType,
  ITransactionAttachment,
  UTransactionStatus,
  UTransactionType,
} from '../../types/transaction.types';
import { TMakeTransactionLineItemPayload } from '../transaction-line.entity';

function generateReference(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomStr = '';
  for (let i = 0; i < 3; i++) {
    randomStr += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return `REF-${randomStr}-${Date.now()}`.toUpperCase();
}

function validateReference(reference: string) {
  const isValid = stringUtils.isNonEmptyString(reference);
  if (!isValid) {
    throw new transactionError.InvalidReference({ reference });
  }
}

function validateType(type: UTransactionType) {
  const isValid = Object.values(ETransactionType).includes(type);
  if (!isValid) {
    throw new transactionError.InvalidType({ type });
  }
}

function validateStatus(status: UTransactionStatus) {
  const isValid = Object.values(ETransactionStatus).includes(status);
  if (!isValid) {
    throw new transactionError.InvalidStatus({ status });
  }
}

function validateAttachment(attachment: ITransactionAttachment) {
  const isValid =
    stringUtils.isUrl(attachment.url) &&
    stringUtils.isNonEmptyString(attachment.name) &&
    stringUtils.isNonEmptyString(attachment.type) &&
    typeof attachment.size === 'number' &&
    attachment.size > 0;

  if (!isValid) {
    throw new transactionError.InvalidAttachment({ attachment });
  }
}

function validateAttachments(attachments: ITransactionAttachment[]) {
  const isValid = Array.isArray(attachments);
  if (!isValid) {
    throw new transactionError.InvalidAttachments({ attachments });
  }

  for (const attachment of attachments) {
    validateAttachment(attachment);
  }
}

function validateCounterpartyId(
  transactionType: UTransactionType,
  counterPartyId: TEntityId | null
) {
  const isTransfer = transactionType === ETransactionType.Transfer;

  if (!counterPartyId) {
    if (isTransfer) return;

    throw new transactionError.MissingCounterpartyId({
      counterPartyId,
    });
  }

  stringUtils.validateUUID(counterPartyId);
}

function sanitizeAndValidateNotes(notes: string | null | undefined) {
  if (!notes) return null;

  return stringUtils.sanitizeAndValidate(notes, { min: 1, max: 100 });
}

function validateItemsPayload(items: TMakeTransactionLineItemPayload[]) {
  if (items.length === 0) {
    throw new transactionError.InsufficientTransactionItems({
      items,
    });
  }
}

const transactionEntityHelpers = Object.freeze({
  generateReference,
  validateReference,
  validateType,
  validateStatus,
  validateAttachment,
  validateAttachments,
  validateCounterpartyId,
  sanitizeAndValidateNotes,
  validateItemsPayload,
});

export default transactionEntityHelpers;
