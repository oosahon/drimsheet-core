import dateUtils from '../../../shared/utils/date';
import generateDiff from '../../../shared/utils/diff-generator';
import stringUtils from '../../../shared/utils/string';
import historyError from '../../../shared/values/history/history.error';
import ledgerAccountError from '../errors/ledger-account.error';
import {
  ELedgerAccountAuditAction,
  ILedgerAccountAudit,
  IMakeLedgerAccountAuditPayload,
} from '../types/ledger-account-audit.types';

function make(payload: IMakeLedgerAccountAuditPayload): ILedgerAccountAudit {
  stringUtils.validateUUID(payload.after.id, ledgerAccountError.InvalidId);
  stringUtils.validateIsInEnum(
    payload.action,
    ELedgerAccountAuditAction,
    ledgerAccountError.InvalidAction
  );
  dateUtils.validateDate(
    payload.after.updatedAt,
    ledgerAccountError.InvalidDate
  );

  const { before, after, hasChanges } = generateDiff(
    payload.after,
    payload.before
  );

  if (!hasChanges) {
    throw new historyError.InvalidDiff();
  }

  const audit: ILedgerAccountAudit = {
    entityId: payload.after.id,
    action: payload.action,
    diff: { before, after },
    occurredAt: payload.after.updatedAt,
  };

  return Object.freeze(audit);
}

const ledgerAccountAudit = Object.freeze({
  make,
});

export default ledgerAccountAudit;
