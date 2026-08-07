import ledgerAccountEntity from '../../../entities/ledger-account.entity';
import { TRetainedEarningsLedgerCode } from '../../../types/ledger-code.types';

function getCode(
  predecessorCode: TRetainedEarningsLedgerCode | null
): TRetainedEarningsLedgerCode {
  if (predecessorCode === null) {
    return '301000' as TRetainedEarningsLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TRetainedEarningsLedgerCode>(
    '301',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TRetainedEarningsLedgerCode,
  parentMaterializedPath: TRetainedEarningsLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TRetainedEarningsLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
