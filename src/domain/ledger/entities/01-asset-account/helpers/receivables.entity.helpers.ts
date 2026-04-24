import { TReceivablesLedgerCode } from '../../../types/ledger-code.types';
import ledgerAccountEntity from '../../shared/ledger-account.entity';

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
