import ledgerAccountEntity from '../../../shared/entities/ledger-account.entity';
import { TUnrealizedGainLedgerCode } from '../../../shared/types/ledger-code.types';

function getCode(
  predecessorCode: TUnrealizedGainLedgerCode | null
): TUnrealizedGainLedgerCode {
  if (predecessorCode === null) {
    return '406000' as TUnrealizedGainLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TUnrealizedGainLedgerCode>(
    '406',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TUnrealizedGainLedgerCode,
  parentMaterializedPath: TUnrealizedGainLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TUnrealizedGainLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
