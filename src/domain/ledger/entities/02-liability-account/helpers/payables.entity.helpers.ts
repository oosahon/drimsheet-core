import { TPayablesLedgerCode } from '../../../types/ledger-code.types';
import ledgerAccountEntity from '../../shared/ledger-account.entity';

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
