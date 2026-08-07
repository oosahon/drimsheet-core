import ledgerAccountEntity from '../../../shared/entities/ledger-account.entity';
import { TAssetSuspenseLedgerCode } from '../../../types/ledger-code.types';

function getCode(
  predecessorCode: TAssetSuspenseLedgerCode | null
): TAssetSuspenseLedgerCode {
  if (predecessorCode === null) {
    return '199000' as TAssetSuspenseLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TAssetSuspenseLedgerCode>(
    '199',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TAssetSuspenseLedgerCode,
  parentMaterializedPath: TAssetSuspenseLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TAssetSuspenseLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
