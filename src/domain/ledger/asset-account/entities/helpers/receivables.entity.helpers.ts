import ledgerAccountEntity from '../../../shared/entities/ledger-account.entity';
import { TReceivablesLedgerCode } from '../../../shared/types/ledger-code.types';

function getCode(
  predecessorCode: TReceivablesLedgerCode | null
): TReceivablesLedgerCode {
  if (predecessorCode === null) {
    return '102000';
  }

  return ledgerAccountEntity.getSubLedgerCode<TReceivablesLedgerCode>(
    '102',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TReceivablesLedgerCode,
  parentMaterializedPath: TReceivablesLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TReceivablesLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const receivablesAccountEntityHelpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default receivablesAccountEntityHelpers;
