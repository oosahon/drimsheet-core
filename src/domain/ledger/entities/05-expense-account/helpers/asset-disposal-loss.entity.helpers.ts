import { TAssetDisposalLossLedgerCode } from '../../../types/ledger-code.types';
import ledgerAccountEntity from '../../shared/ledger-account.entity';

function getCode(
  predecessorCode: TAssetDisposalLossLedgerCode | null
): TAssetDisposalLossLedgerCode {
  if (predecessorCode === null) {
    return '512000' as TAssetDisposalLossLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TAssetDisposalLossLedgerCode>(
    '512',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TAssetDisposalLossLedgerCode,
  parentMaterializedPath: TAssetDisposalLossLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TAssetDisposalLossLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
