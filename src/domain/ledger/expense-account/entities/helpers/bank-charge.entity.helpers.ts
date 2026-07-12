import ledgerAccountEntity from '../../../shared/entities/ledger-account.entity';
import { TBankChargeLedgerCode } from '../../../shared/types/ledger-code.types';

function getCode(
  predecessorCode: TBankChargeLedgerCode | null
): TBankChargeLedgerCode {
  if (predecessorCode === null) {
    return '507000' as TBankChargeLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TBankChargeLedgerCode>(
    '507',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TBankChargeLedgerCode,
  parentMaterializedPath: TBankChargeLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TBankChargeLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
