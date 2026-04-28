import { AppError } from '../../../../shared/errors/error';
import stringUtils from '../../../../shared/utils/string';
import {
  SYSTEM_ACCOUNTING_STANDARDS,
  UAccountingStandardCode,
} from '../../config/accounting-standards.config';

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

function getDescription(description: string | null) {
  return description != null
    ? stringUtils.sanitizeAndValidate(description, {
        min: 1,
        max: 255,
      })
    : null;
}

const accountingContextEntityHelpers = Object.freeze({
  isValidAccountingStandardCode,
  validateAccountingStandardCode,
  getDescription,
});

export default accountingContextEntityHelpers;
