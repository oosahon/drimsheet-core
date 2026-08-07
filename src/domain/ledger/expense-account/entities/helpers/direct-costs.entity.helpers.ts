import ledgerAccountEntity from '../../../shared/entities/ledger-account.entity';
import { TDirectCostsLedgerCode } from '../../../types/ledger-code.types';

function getCode(
  predecessorCode: TDirectCostsLedgerCode | null
): TDirectCostsLedgerCode {
  if (predecessorCode === null) {
    return '500000' as TDirectCostsLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TDirectCostsLedgerCode>(
    '500',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TDirectCostsLedgerCode,
  parentMaterializedPath: TDirectCostsLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TDirectCostsLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
