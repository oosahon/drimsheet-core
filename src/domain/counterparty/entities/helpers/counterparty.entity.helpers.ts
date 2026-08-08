import { TEntityId } from '@shared/types/uuid';
import dateUtils from '@shared/utils/date';
import stringUtils from '@shared/utils/string';

import counterpartyError from '@domain/counterparty/errors/counterparty.error';
import {
  ECounterpartyRole,
  ECounterpartyStatus,
  ECounterpartyType,
  ICounterparty,
  UCounterpartyRole,
  UCounterpartyStatus,
  UCounterpartyType,
} from '@domain/counterparty/types/counterparty.types';

function validateAccountingEntityId(accountingEntityId: TEntityId): void {
  stringUtils.validateUUID(
    accountingEntityId,
    counterpartyError.InvalidAccountingEntityId
  );
}

function validateName(name: string): string {
  return stringUtils.sanitizeAndValidate(
    name,
    { min: 1, max: 255 },
    counterpartyError.InvalidName
  );
}

function validateType(type: UCounterpartyType): UCounterpartyType {
  stringUtils.validateIsInEnum(
    type,
    ECounterpartyType,
    counterpartyError.InvalidType
  );
  return type;
}

function validateStatus(status: UCounterpartyStatus): UCounterpartyStatus {
  stringUtils.validateIsInEnum(
    status,
    ECounterpartyStatus,
    counterpartyError.InvalidStatus
  );
  return status;
}

function validateRole(role: UCounterpartyRole): UCounterpartyRole {
  stringUtils.validateIsInEnum(
    role,
    ECounterpartyRole,
    counterpartyError.InvalidRole
  );
  return role;
}

function validateCounterparty(counterparty: ICounterparty): void {
  if (!counterparty || typeof counterparty !== 'object') {
    throw new counterpartyError.InvalidCounterpartyEntity({ counterparty });
  }

  stringUtils.validateUUID(
    counterparty.id,
    counterpartyError.InvalidCounterpartyId
  );
  validateAccountingEntityId(counterparty.accountingEntityId);
  validateName(counterparty.name);
  validateType(counterparty.type);
  validateStatus(counterparty.status);

  if (!Array.isArray(counterparty.roles)) {
    throw new counterpartyError.InvalidRole({ roles: counterparty.roles });
  }
  for (const role of counterparty.roles) {
    validateRole(role);
  }

  dateUtils.validateDate(counterparty.createdAt, counterpartyError.InvalidDate);
  dateUtils.validateDate(counterparty.updatedAt, counterpartyError.InvalidDate);
}

const counterpartyEntityHelpers = Object.freeze({
  validateAccountingEntityId,
  validateName,
  validateType,
  validateStatus,
  validateRole,
  validateCounterparty,
});

export default counterpartyEntityHelpers;
