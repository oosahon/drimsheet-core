import ledgerAccountEntity from '../../../shared/entities/ledger-account.entity';
import { TOpeningBalanceEquityLedgerCode } from '../../../shared/types/ledger-code.types';

function getCode(
  predecessorCode: TOpeningBalanceEquityLedgerCode | null
): TOpeningBalanceEquityLedgerCode {
  if (predecessorCode === null) {
    return '399000' as TOpeningBalanceEquityLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TOpeningBalanceEquityLedgerCode>(
    '399',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TOpeningBalanceEquityLedgerCode,
  parentMaterializedPath: TOpeningBalanceEquityLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TOpeningBalanceEquityLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
