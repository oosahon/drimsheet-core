import { AppError } from '../../../../shared/value-objects/error';
import {
  SYSTEM_ACCOUNTING_STANDARDS,
  UAccountingStandardCode,
} from '../../config/accounting-standards.config';
import {
  SYSTEM_JURISDICTIONS,
  UJurisdictionCode,
} from '../../config/jurisdictions.config';

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

function isValidAccountingStandardCode(
  code: unknown
): code is UAccountingStandardCode {
  return Object.keys(SYSTEM_ACCOUNTING_STANDARDS).includes(
    code as UAccountingStandardCode
  );
}

function validateAccountingStandardCode(code: unknown) {
  if (!isValidAccountingStandardCode(code)) {
    throw new AppError('Invalid accounting standard code', {
      cause: code as Record<string, unknown>,
    });
  }
}

const accountingContextEntityHelpers = Object.freeze({
  isValidJurisdictionCode,
  validateJurisdictionCode,
  isValidAccountingStandardCode,
  validateAccountingStandardCode,
});

export default accountingContextEntityHelpers;
