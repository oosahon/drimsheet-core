import historyError from '../../../shared/errors/history.error';
import dateUtils from '../../../shared/utils/date';
import generateDiff from '../../../shared/utils/diff-generator';
import stringUtils from '../../../shared/utils/string';
import ledgerError from '../errors/ledger.error';
import {
  ELedgerAccountAuditAction,
  ILedgerAccountAudit,
  IMakeLedgerAccountAuditPayload,
} from '../types/ledger-account-audit.types';

function make(payload: IMakeLedgerAccountAuditPayload): ILedgerAccountAudit {
  stringUtils.validateUUID(payload.after.id, ledgerError.InvalidId);
  stringUtils.validateIsInEnum(
    payload.action,
    ELedgerAccountAuditAction,
    ledgerError.InvalidAction
  );
  dateUtils.validateDate(payload.after.updatedAt, ledgerError.InvalidDate);

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
