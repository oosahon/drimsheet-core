import ledgerAccountEntity from '../../../entities/ledger-account.entity';
import { TLiabilitySuspenseLedgerCode } from '../../../types/ledger-code.types';

function getCode(
  predecessorCode: TLiabilitySuspenseLedgerCode | null
): TLiabilitySuspenseLedgerCode {
  if (predecessorCode === null) {
    return '299000' as TLiabilitySuspenseLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TLiabilitySuspenseLedgerCode>(
    '299',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TLiabilitySuspenseLedgerCode,
  parentMaterializedPath: TLiabilitySuspenseLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TLiabilitySuspenseLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
