import stringUtils from '../../../../shared/utils/string';
import {
  SYSTEM_ACCOUNTING_STANDARDS,
  UAccountingStandardCode,
} from '../../config/accounting-standards.config';
import {
  SYSTEM_JURISDICTIONS,
  UJurisdictionCode,
} from '../../config/jurisdictions.config';
import accountingStandardError from '../../errors/accounting-standard.error';
import accountingError from '../../errors/accounting.error';
import jurisdictionError from '../../errors/jurisdiction.error';
import { UAccountingEntityType } from '../../types/accounting-entity.types';
import accountingEntityHelpers from './accounting-entity.entity.helpers';

function isValidAccountingStandardCode(
  code: unknown
): code is UAccountingStandardCode {
  return Object.keys(SYSTEM_ACCOUNTING_STANDARDS).includes(
    code as UAccountingStandardCode
  );
}

function validateAccountingStandardCode(code: unknown) {
  if (!isValidAccountingStandardCode(code)) {
    throw new accountingStandardError.Invalid({ code });
  }
}

function getDescription(description: string | null) {
  return description != null
    ? stringUtils.sanitizeAndValidate(
        description,
        {
          min: 1,
          max: 255,
        },
        accountingError.InvalidValue
      )
    : null;
}

function getJurisdiction(code: string) {
  if (!code) {
    throw new jurisdictionError.Invalid();
  }

  const jurisdiction = SYSTEM_JURISDICTIONS[code as UJurisdictionCode];

  if (!jurisdiction) {
    throw new jurisdictionError.Invalid();
  }

  return jurisdiction;
}

function validateStandardCode(code: UAccountingStandardCode) {
  if (!code) {
    throw new accountingStandardError.Invalid();
  }

  const standard = SYSTEM_ACCOUNTING_STANDARDS[code];

  if (!standard) {
    throw new accountingStandardError.Invalid();
  }
}

function validateStandardCodeAndJurisdiction(
  code: UAccountingStandardCode,
  jurisdiction: string,
  accountingEntityType: UAccountingEntityType
) {
  accountingEntityHelpers.validateType(accountingEntityType);

  const jurisdictionObj = getJurisdiction(jurisdiction);

  const availableStandards =
    jurisdictionObj.accountingStandards[accountingEntityType];

  if (!availableStandards) {
    throw new accountingStandardError.Invalid();
  }

  const isIncluded = availableStandards.includes(code);

  if (!isIncluded) {
    throw new accountingStandardError.Invalid();
  }
}

function getStandard(code: UAccountingStandardCode) {
  const standard = SYSTEM_ACCOUNTING_STANDARDS[code];

  if (!standard) {
    throw new accountingStandardError.Invalid();
  }

  return standard;
}

const accountingContextEntityHelpers = Object.freeze({
  isValidAccountingStandardCode,
  validateAccountingStandardCode,
  getDescription,

  validateStandardCode,
  getJurisdiction,
  validateStandardCodeAndJurisdiction,

  getStandard,
});

export default accountingContextEntityHelpers;
