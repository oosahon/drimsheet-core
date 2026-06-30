import ledgerAccountEntity from '../../../shared/entities/ledger-account.entity';
import { TFinanceCostLedgerCode } from '../../../shared/types/ledger-code.types';

function getCode(
  predecessorCode: TFinanceCostLedgerCode | null
): TFinanceCostLedgerCode {
  if (predecessorCode === null) {
    return '508000' as TFinanceCostLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TFinanceCostLedgerCode>(
    '508',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TFinanceCostLedgerCode,
  parentMaterializedPath: TFinanceCostLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TFinanceCostLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
