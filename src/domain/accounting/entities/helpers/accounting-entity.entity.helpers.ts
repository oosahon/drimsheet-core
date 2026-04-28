import { AppError } from '../../../../shared/value-objects/error';
import {
  EAccountingEntityAuditTrailAction,
  EAccountingEntityType,
  UAccountingEntityAuditTrailAction,
  UAccountingEntityType,
} from '../../types/accounting-entity.types';

function isValidType(type: UAccountingEntityType) {
  return Object.values(EAccountingEntityType).includes(type);
}

function validateType(type: UAccountingEntityType) {
  if (!isValidType(type)) {
    throw new AppError('Invalid accounting entity type', { cause: type });
  }
}

function isValidAuditTrailAction(action: UAccountingEntityAuditTrailAction) {
  return Object.values(EAccountingEntityAuditTrailAction).includes(action);
}

function validateAuditTrailAction(action: UAccountingEntityAuditTrailAction) {
  if (!isValidAuditTrailAction(action)) {
    throw new AppError('Invalid accounting entity audit trail action', {
      cause: action,
    });
  }
}

const accountingEntityHelpers = Object.freeze({
  isValidType,
  validateType,

  isValidAuditTrailAction,
  validateAuditTrailAction,
});

export default accountingEntityHelpers;
