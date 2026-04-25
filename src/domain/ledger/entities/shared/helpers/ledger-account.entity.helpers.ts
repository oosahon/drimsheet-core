import stringUtils from '../../../../../shared/utils/string';
import { AppError } from '../../../../../shared/value-objects/error';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
  UAdjunctAccountRule,
  UContraAccountRule,
  ULedgerAccountStatus,
  ULedgerType,
  UNormalBalance,
} from '../../../types/ledger.types';

function getNormalBalance(type: ULedgerType): UNormalBalance {
  switch (type) {
    case ELedgerType.Asset:
    case ELedgerType.Expense:
      return ENormalBalance.Debit;

    case ELedgerType.Liability:
    case ELedgerType.Equity:
    case ELedgerType.Revenue:
      return ENormalBalance.Credit;
    default:
      throw new AppError('Invalid ledger type', { cause: type });
  }
}

function getContraBalance(normalBalance: UNormalBalance): UNormalBalance {
  switch (normalBalance) {
    case ENormalBalance.Debit:
      return ENormalBalance.Credit;
    case ENormalBalance.Credit:
      return ENormalBalance.Debit;
    default:
      throw new AppError('Invalid normal balance', { cause: normalBalance });
  }
}

function validateCode(code: string) {
  if (!/^[1-5][0-9]{5}$/.test(code)) {
    throw new AppError('Invalid ledger code', { cause: code });
  }
}

function validateType(type: ULedgerType) {
  if (!Object.values(ELedgerType).includes(type)) {
    throw new AppError('Invalid ledger type', { cause: type });
  }
}

function validateStatus(status: ULedgerAccountStatus) {
  if (!Object.values(ELedgerAccountStatus).includes(status)) {
    throw new AppError('Invalid ledger status', { cause: status });
  }
}

function validateContraRule(rule: UContraAccountRule) {
  if (!Object.values(EContraAccountRule).includes(rule)) {
    throw new AppError('Invalid contra account rule', { cause: rule });
  }
}

function validateAdjunctRule(rule: UAdjunctAccountRule) {
  if (!Object.values(EAdjunctAccountRule).includes(rule)) {
    throw new AppError('Invalid adjunct account rule', { cause: rule });
  }
}

function validateNormalBalance(normalBalance: UNormalBalance) {
  if (!Object.values(ENormalBalance).includes(normalBalance)) {
    throw new AppError('Invalid normal balance', { cause: normalBalance });
  }
}

function validateSubType(subType: string) {
  if (!stringUtils.isNonEmptyString(subType)) {
    throw new AppError('Invalid ledger sub-type', { cause: subType });
  }
}

function validateBehavior(behavior: string) {
  if (!stringUtils.isNonEmptyString(behavior)) {
    throw new AppError('Invalid ledger behavior', { cause: behavior });
  }
}

function validateIsControlAccount(isControlAccount: boolean) {
  if (typeof isControlAccount !== 'boolean') {
    throw new AppError('Control account status must be a boolean', {
      cause: isControlAccount,
    });
  }
}

function validateMeta(meta: unknown) {
  if (meta !== null && typeof meta !== 'object') {
    throw new AppError('Invalid meta', { cause: meta });
  }
}

function getSubLedgerCode<T extends string>(
  headerCode: string,
  predecessorCode: T
): T {
  if (!/^[1-5][0-9]{2}$/.test(headerCode)) {
    throw new AppError('Invalid ledger header code', { cause: headerCode });
  }

  const code = predecessorCode.substring(3);
  const isInvalidPredecessorCode =
    !predecessorCode.startsWith(headerCode) || code.length !== 3;
  if (isInvalidPredecessorCode) {
    throw new AppError('Invalid predecessor code', { cause: predecessorCode });
  }

  if (code === '999') {
    throw new AppError('Limit reached for ledger code', {
      cause: predecessorCode,
    });
  }

  const nextCode = (Number(code) + 1).toString().padStart(3, '0');

  return `${headerCode}${nextCode}` as T;
}

function validateMaterializedPath(materializedPath: string) {
  // We only permit 10 levels of ledger accounts
  const isValid = stringUtils.isStringWithinRange(materializedPath, {
    min: 6,
    max: 69,
    sanitize: false,
  });

  if (!isValid) {
    throw new AppError('Invalid materialized path', {
      cause: materializedPath,
    });
  }
}

function getMaterializedPath<T extends string>(
  parentMaterializedPath: T,
  code: string
): T {
  // We only permit 10 levels of ledger accounts
  const isValidParent = stringUtils.isStringWithinRange(
    parentMaterializedPath,
    {
      min: 6,
      max: 62,
      sanitize: false,
    }
  );

  if (!isValidParent) {
    throw new AppError('Invalid parent materialized path', {
      cause: parentMaterializedPath,
    });
  }

  return `${parentMaterializedPath}.${code}` as T;
}

function getAncestryCodesFromMaterializedPath(materializePath: string) {
  validateMaterializedPath(materializePath);

  const codes = materializePath.split('.');

  codes.forEach((code) => {
    validateCode(code);
  });

  return codes;
}

const ledgerAccountEntityHelpers = Object.freeze({
  getNormalBalance,
  getContraBalance,
  validateCode,
  validateType,
  validateStatus,
  validateContraRule,
  validateAdjunctRule,
  validateNormalBalance,
  validateSubType,
  validateBehavior,
  validateIsControlAccount,
  validateMeta,
  getSubLedgerCode,
  validateMaterializedPath,
  getMaterializedPath,
  getAncestryCodesFromMaterializedPath,
});

export default ledgerAccountEntityHelpers;
