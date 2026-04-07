import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import stringUtils from '../../../../shared/utils/string';
import generateUUID from '../../../../shared/utils/uuid-generator';
import { AppError } from '../../../../shared/value-objects/error';
import currencyEntity from '../../../currency/entities/currency.entity';
import {
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
  ULedgerAccountStatus,
  ULedgerType,
  UContraAccountRule,
  EContraAccountRule,
  UAdjunctAccountRule,
  EAdjunctAccountRule,
  ENormalBalance,
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

function make<T extends ILedgerAccount>(
  payload: TCreationOmits<T>
): Readonly<T> {
  validateCode(payload.code);
  stringUtils.validateUUID(payload.accountingEntityId);
  validateType(payload.type);

  if (payload.controlAccountId) {
    stringUtils.validateUUID(payload.controlAccountId);
  }

  currencyEntity.validateCode(payload.currency.code);
  validateStatus(payload.status);

  validateContraRule(payload.contraAccountRule);
  validateAdjunctRule(payload.adjunctAccountRule);
  stringUtils.validateUUID(payload.createdBy);

  validateSubType(payload.subType);
  validateBehavior(payload.behavior);
  validateNormalBalance(payload.normalBalance);

  validateIsControlAccount(payload.isControlAccount);
  validateMeta(payload.meta);

  const timestamp = new Date();

  const ledgerAccount: ILedgerAccount = {
    id: generateUUID(),
    code: payload.code,
    accountingEntityId: payload.accountingEntityId,
    type: payload.type,
    normalBalance: payload.normalBalance,
    subType: payload.subType,
    behavior: payload.behavior,
    isControlAccount: !!payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    name: stringUtils.sanitizeAndValidate(payload.name, { min: 2, max: 100 }),
    currency: payload.currency,
    status: payload.status,
    contraAccountRule: payload.contraAccountRule,
    adjunctAccountRule: payload.adjunctAccountRule,
    // Proper meta validation is delegated to the specific ledger account entity
    meta: payload.meta,
    createdBy: payload.createdBy,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };

  return Object.freeze(ledgerAccount) as Readonly<T>;
}

const ledgerAccountEntity = Object.freeze({
  make,
  validateCode,
  validateType,
  validateStatus,
  validateContraRule,
  validateAdjunctRule,

  getSubLedgerCode,

  getNormalBalance,
  getContraBalance,
});

export default ledgerAccountEntity;
