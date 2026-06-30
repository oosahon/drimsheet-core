import ledgerAccountEntity from '../../../shared/entities/ledger-account.entity';
import { TRentUtilitiesLedgerCode } from '../../../shared/types/ledger-code.types';

function getCode(
  predecessorCode: TRentUtilitiesLedgerCode | null
): TRentUtilitiesLedgerCode {
  if (predecessorCode === null) {
    return '502000' as TRentUtilitiesLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TRentUtilitiesLedgerCode>(
    '502',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TRentUtilitiesLedgerCode,
  parentMaterializedPath: TRentUtilitiesLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TRentUtilitiesLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
