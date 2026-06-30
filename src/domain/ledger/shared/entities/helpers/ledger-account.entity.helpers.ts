import stringUtils from '../../../../../shared/utils/string';
import ledgerAccountError from '../../errors/ledger-account.error';
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
} from '../../types/ledger.types';

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
      throw new ledgerAccountError.InvalidType({ type });
  }
}

function getContraBalance(normalBalance: UNormalBalance): UNormalBalance {
  switch (normalBalance) {
    case ENormalBalance.Debit:
      return ENormalBalance.Credit;
    case ENormalBalance.Credit:
      return ENormalBalance.Debit;
    default:
      throw new ledgerAccountError.InvalidNormalBalance({
        normalBalance,
      });
  }
}

function validateCode(code: string) {
  if (!/^[1-5][0-9]{5}$/.test(code)) {
    throw new ledgerAccountError.InvalidCode({ code });
  }
}

function validateType(type: ULedgerType) {
  if (!Object.values(ELedgerType).includes(type)) {
    throw new ledgerAccountError.InvalidType({ type });
  }
}

function validateStatus(status: ULedgerAccountStatus) {
  if (!Object.values(ELedgerAccountStatus).includes(status)) {
    throw new ledgerAccountError.InvalidStatus({ status });
  }
}

function validateContraRule(rule: UContraAccountRule) {
  if (!Object.values(EContraAccountRule).includes(rule)) {
    throw new ledgerAccountError.InvalidContraRule({ rule });
  }
}

function validateAdjunctRule(rule: UAdjunctAccountRule) {
  if (!Object.values(EAdjunctAccountRule).includes(rule)) {
    throw new ledgerAccountError.InvalidAdjunctRule({ rule });
  }
}

function validateNormalBalance(normalBalance: UNormalBalance) {
  if (!Object.values(ENormalBalance).includes(normalBalance)) {
    throw new ledgerAccountError.InvalidNormalBalance({ normalBalance });
  }
}

function validateSubType(subType: string) {
  if (!stringUtils.isNonEmptyString(subType)) {
    throw new ledgerAccountError.InvalidSubType({ subType });
  }
}

function validateBehavior(behavior: string) {
  if (!stringUtils.isNonEmptyString(behavior)) {
    throw new ledgerAccountError.InvalidBehavior({ behavior });
  }
}

function validateIsControlAccount(isControlAccount: boolean) {
  if (typeof isControlAccount !== 'boolean') {
    throw new ledgerAccountError.InvalidControlAccountStatus({
      isControlAccount,
    });
  }
}

function validateMeta(meta: unknown) {
  if (meta !== null && typeof meta !== 'object') {
    throw new ledgerAccountError.InvalidMeta({ meta });
  }
}

function getSubLedgerCode<T extends string>(
  headerCode: string,
  predecessorCode: T
): T {
  if (!/^[1-5][0-9]{2}$/.test(headerCode)) {
    throw new ledgerAccountError.InvalidHeaderCode({ headerCode });
  }

  const code = predecessorCode.substring(3);
  const isInvalidPredecessorCode =
    !predecessorCode.startsWith(headerCode) || code.length !== 3;
  if (isInvalidPredecessorCode) {
    throw new ledgerAccountError.InvalidPredecessorCode({
      predecessorCode,
    });
  }

  if (code === '999') {
    throw new ledgerAccountError.MaximumLimitReached({
      predecessorCode,
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
    throw new ledgerAccountError.InvalidMaterializedPath({
      materializedPath,
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
    throw new ledgerAccountError.InvalidParentMaterializedPath({
      parentMaterializedPath,
    });
  }

  return `${parentMaterializedPath}.${code}` as T;
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
});

export default ledgerAccountEntityHelpers;
