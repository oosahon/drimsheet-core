import stringUtils from '../../../../../shared/utils/string';
import ledgerAccountEntity from '../../../shared/entities/ledger-account.entity';
import ledgerError from '../../../shared/errors/ledger.error';
import { TCashLedgerCode } from '../../../types/ledger-code.types';
import { IBankAccountMeta } from '../../types/asset-account.types';

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
  const bankName = stringUtils.sanitizeAndValidate(
    meta.bankName,
    {
      min: 2,
      max: 100,
    },
    ledgerError.InvalidValue
  );

  const accountNumber = stringUtils.sanitizeAndValidate(
    meta.accountNumber,
    {
      min: 6,
      max: 34,
    },
    ledgerError.InvalidValue
  );

  const accountName = stringUtils.sanitizeAndValidate(
    meta.accountName,
    {
      min: 2,
      max: 100,
    },
    ledgerError.InvalidValue
  );

  let sortCode: string | null = null;
  if (meta.sortCode) {
    sortCode = stringUtils.sanitizeAndValidate(
      meta.sortCode,
      {
        min: 6,
        max: 6,
      },
      ledgerError.InvalidValue
    );
  }

  let swiftCode: string | null = null;
  if (meta.swiftCode) {
    swiftCode = stringUtils.sanitizeAndValidate(
      meta.swiftCode,
      {
        min: 8,
        max: 11,
      },
      ledgerError.InvalidValue
    );
  }

  let iban: string | null = null;
  if (meta.iban) {
    iban = stringUtils.sanitizeAndValidate(
      meta.iban,
      {
        min: 15,
        max: 34,
      },
      ledgerError.InvalidValue
    );
  }

  let routingNumber: string | null = null;
  if (meta.routingNumber) {
    routingNumber = stringUtils.sanitizeAndValidate(
      meta.routingNumber,
      {
        min: 9,
        max: 9,
      },
      ledgerError.InvalidValue
    );
  }

  let branchCode: string | null = null;
  if (meta.branchCode) {
    branchCode = stringUtils.sanitizeAndValidate(
      meta.branchCode,
      {
        min: 1,
        max: 10,
      },
      ledgerError.InvalidValue
    );
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
