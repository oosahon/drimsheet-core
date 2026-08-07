import ledgerAccountEntity from '../../../shared/entities/ledger-account.entity';
import { TGainOnAssetSaleLedgerCode } from '../../../types/ledger-code.types';

function getCode(
  predecessorCode: TGainOnAssetSaleLedgerCode | null
): TGainOnAssetSaleLedgerCode {
  if (predecessorCode === null) {
    return '405000' as TGainOnAssetSaleLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TGainOnAssetSaleLedgerCode>(
    '405',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TGainOnAssetSaleLedgerCode,
  parentMaterializedPath: TGainOnAssetSaleLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TGainOnAssetSaleLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
