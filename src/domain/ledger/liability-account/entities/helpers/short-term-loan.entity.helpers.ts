import ledgerAccountEntity from '../../../shared/entities/ledger-account.entity';
import { TShortTermDebtLedgerCode } from '../../../shared/types/ledger-code.types';

function getCode(
  predecessorCode: TShortTermDebtLedgerCode | null
): TShortTermDebtLedgerCode {
  if (predecessorCode === null) {
    return '200000' as TShortTermDebtLedgerCode;
  }

  return ledgerAccountEntity.getSubLedgerCode<TShortTermDebtLedgerCode>(
    '200',
    predecessorCode
  );
}

function getMaterializedPath(
  code: TShortTermDebtLedgerCode,
  parentMaterializedPath: TShortTermDebtLedgerCode | null
) {
  if (parentMaterializedPath === null) {
    return code;
  }
  return ledgerAccountEntity.getMaterializedPath<TShortTermDebtLedgerCode>(
    parentMaterializedPath,
    code
  );
}

const helpers = Object.freeze({
  getCode,
  getMaterializedPath,
});

export default helpers;
