import ledgerAccountEntity from '../../../shared/entities/ledger-account.entity';
import { TGiftsLedgerCode } from '../../../types/ledger-code.types';

function getCode(predecessorCode: TGiftsLedgerCode | null): TGiftsLedgerCode {
  if (predecessorCode === null) {
    return '408000' as TGiftsLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TGiftsLedgerCode>(
    '408',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TGiftsLedgerCode,
  parentMaterializedPath: TGiftsLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TGiftsLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
