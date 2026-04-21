import { TUnrealizedLossLedgerCode } from '../../../types/ledger-code.types';
import ledgerAccountEntity from '../../shared/ledger-account.entity';

function getCode(
  predecessorCode: TUnrealizedLossLedgerCode | null
): TUnrealizedLossLedgerCode {
  if (predecessorCode === null) {
    return '509000' as TUnrealizedLossLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TUnrealizedLossLedgerCode>(
    '509',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TUnrealizedLossLedgerCode,
  parentMaterializedPath: TUnrealizedLossLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TUnrealizedLossLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
