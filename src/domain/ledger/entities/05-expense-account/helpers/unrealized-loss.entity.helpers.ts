import { TUnrealizedLossLedgerCode } from '../../../types/ledger-code.types';
import ledgerAccountEntity from '../../shared/ledger-account.entity';

function getCode(
  predecessorCode: TUnrealizedLossLedgerCode | null
): TUnrealizedLossLedgerCode {
  if (predecessorCode === null) {
    return '511000' as TUnrealizedLossLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TUnrealizedLossLedgerCode>(
    '511',
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
