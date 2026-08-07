import ledgerAccountEntity from '../../../shared/entities/ledger-account.entity';
import { TInterestLedgerCode } from '../../../types/ledger-code.types';

function getCode(
  predecessorCode: TInterestLedgerCode | null
): TInterestLedgerCode {
  if (predecessorCode === null) {
    return '509000' as TInterestLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TInterestLedgerCode>(
    '509',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TInterestLedgerCode,
  parentMaterializedPath: TInterestLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TInterestLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
