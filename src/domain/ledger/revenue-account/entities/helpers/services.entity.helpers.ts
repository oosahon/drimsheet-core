import ledgerAccountEntity from '../../../entities/ledger-account.entity';
import { TServicesLedgerCode } from '../../../types/ledger-code.types';

function getCode(
  predecessorCode: TServicesLedgerCode | null
): TServicesLedgerCode {
  if (predecessorCode === null) {
    return '401000' as TServicesLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TServicesLedgerCode>(
    '401',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TServicesLedgerCode,
  parentMaterializedPath: TServicesLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TServicesLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
