import ledgerAccountEntity from '../../../shared/entities/ledger-account.entity';
import { TGrantsLedgerCode } from '../../../types/ledger-code.types';

function getCode(predecessorCode: TGrantsLedgerCode | null): TGrantsLedgerCode {
  if (predecessorCode === null) {
    return '407000' as TGrantsLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TGrantsLedgerCode>(
    '407',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TGrantsLedgerCode,
  parentMaterializedPath: TGrantsLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TGrantsLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
