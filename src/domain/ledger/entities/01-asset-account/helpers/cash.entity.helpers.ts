import stringUtils from '../../../../../shared/utils/string';
import { IBankAccountMeta } from '../../../types/asset-account.types';
import { TCashLedgerCode } from '../../../types/ledger-code.types';
import ledgerAccountEntity from '../../shared/ledger-account.entity';

function getCode(predecessorCode: TCashLedgerCode | null): TCashLedgerCode {
  if (predecessorCode === null) {
    return '100000';
  }

  return ledgerAccountEntity.getSubLedgerCode<TCashLedgerCode>(
    '100',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TCashLedgerCode,
  parentMaterializedPath: TCashLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TCashLedgerCode>(
    parentMaterializedPath,
    code
  );
}

function makeBankAccountMeta(meta: IBankAccountMeta) {
  const bankName = stringUtils.sanitizeAndValidate(meta.bankName, {
    min: 2,
    max: 100,
  });

  const accountNumber = stringUtils.sanitizeAndValidate(meta.accountNumber, {
    min: 6,
    max: 34,
  });

  const accountName = stringUtils.sanitizeAndValidate(meta.accountName, {
    min: 2,
    max: 100,
  });

  let sortCode: string | null = null;
  if (meta.sortCode) {
    sortCode = stringUtils.sanitizeAndValidate(meta.sortCode, {
      min: 6,
      max: 6,
    });
  }

  let swiftCode: string | null = null;
  if (meta.swiftCode) {
    swiftCode = stringUtils.sanitizeAndValidate(meta.swiftCode, {
      min: 8,
      max: 11,
    });
  }

  let iban: string | null = null;
  if (meta.iban) {
    iban = stringUtils.sanitizeAndValidate(meta.iban, {
      min: 15,
      max: 34,
    });
  }

  let routingNumber: string | null = null;
  if (meta.routingNumber) {
    routingNumber = stringUtils.sanitizeAndValidate(meta.routingNumber, {
      min: 9,
      max: 9,
    });
  }

  let branchCode: string | null = null;
  if (meta.branchCode) {
    branchCode = stringUtils.sanitizeAndValidate(meta.branchCode, {
      min: 1,
      max: 10,
    });
  }

  return Object.freeze<IBankAccountMeta>({
    bankName,
    accountNumber,
    accountName,
    sortCode,
    swiftCode,
    iban,
    routingNumber,
    branchCode,
    lastReconciliationDate: null,
  });
}

const cashAccountEntityHelpers = Object.freeze({
  getCode,
  getMaterializedPath,
  makeBankAccountMeta,
});

export default cashAccountEntityHelpers;
