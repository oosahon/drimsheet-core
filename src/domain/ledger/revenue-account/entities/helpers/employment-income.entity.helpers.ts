import ledgerAccountEntity from '../../../shared/entities/ledger-account.entity';
import { TEmploymentIncomeLedgerCode } from '../../../types/ledger-code.types';

function getCode(
  predecessorCode: TEmploymentIncomeLedgerCode | null
): TEmploymentIncomeLedgerCode {
  if (predecessorCode === null) {
    return '403000' as TEmploymentIncomeLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TEmploymentIncomeLedgerCode>(
    '403',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TEmploymentIncomeLedgerCode,
  parentMaterializedPath: TEmploymentIncomeLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TEmploymentIncomeLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
