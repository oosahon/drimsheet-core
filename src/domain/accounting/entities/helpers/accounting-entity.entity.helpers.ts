import { AppError } from '../../../../shared/errors/error';
import {
  SYSTEM_JURISDICTIONS,
  UJurisdictionCode,
} from '../../config/jurisdictions.config';
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
    throw new AppError('Invalid accounting entity type', {
      cause: type as any,
    });
  }
}

function isValidJurisdictionCode(code: unknown): code is UJurisdictionCode {
  return Object.keys(SYSTEM_JURISDICTIONS).includes(code as UJurisdictionCode);
}

function validateJurisdictionCode(code: unknown) {
  if (!isValidJurisdictionCode(code)) {
    throw new AppError('Invalid jurisdiction code', {
      cause: code as Record<string, unknown>,
    });
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

  isValidJurisdictionCode,
  validateJurisdictionCode,

  isValidAuditTrailAction,
  validateAuditTrailAction,
});

export default accountingEntityHelpers;
