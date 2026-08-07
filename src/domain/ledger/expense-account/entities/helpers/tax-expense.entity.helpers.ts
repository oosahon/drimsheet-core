import ledgerAccountEntity from '../../../entities/ledger-account.entity';
import { TIncomeTaxLedgerCode } from '../../../types/ledger-code.types';

function getCode(
  predecessorCode: TIncomeTaxLedgerCode | null
): TIncomeTaxLedgerCode {
  if (predecessorCode === null) {
    return '510000' as TIncomeTaxLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TIncomeTaxLedgerCode>(
    '510',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TIncomeTaxLedgerCode,
  parentMaterializedPath: TIncomeTaxLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TIncomeTaxLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
