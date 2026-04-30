import {
  SYSTEM_JURISDICTIONS,
  UJurisdictionCode,
} from '../../config/jurisdictions.config';
import accountingEntityError from '../../errors/accounting-entity.errors';
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
    throw new accountingEntityError.InvalidType({ type });
  }
}

function isValidJurisdictionCode(code: unknown): code is UJurisdictionCode {
  return Object.keys(SYSTEM_JURISDICTIONS).includes(code as UJurisdictionCode);
}

function validateJurisdictionCode(code: unknown) {
  if (!isValidJurisdictionCode(code)) {
    throw new accountingEntityError.InvalidJurisdictionCode({ code });
  }
}

function isValidAuditTrailAction(action: UAccountingEntityAuditTrailAction) {
  return Object.values(EAccountingEntityAuditTrailAction).includes(action);
}

function validateAuditTrailAction(action: UAccountingEntityAuditTrailAction) {
  if (!isValidAuditTrailAction(action)) {
    throw new accountingEntityError.InvalidAuditTrailAction({ action });
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
