import { TInterestFinanceLedgerCode } from '../../../types/ledger-code.types';
import ledgerAccountEntity from '../../shared/ledger-account.entity';

function getCode(
  predecessorCode: TInterestFinanceLedgerCode | null
): TInterestFinanceLedgerCode {
  if (predecessorCode === null) {
    return '507000' as TInterestFinanceLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TInterestFinanceLedgerCode>(
    '507',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TInterestFinanceLedgerCode,
  parentMaterializedPath: TInterestFinanceLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TInterestFinanceLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
