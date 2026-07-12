import ledgerAccountEntity from '../../../shared/entities/ledger-account.entity';
import { TPayablesLedgerCode } from '../../../shared/types/ledger-code.types';

function getCode(
  predecessorCode: TPayablesLedgerCode | null
): TPayablesLedgerCode {
  if (predecessorCode === null) {
    return '201000' as TPayablesLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TPayablesLedgerCode>(
    '201',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TPayablesLedgerCode,
  parentMaterializedPath: TPayablesLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TPayablesLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
