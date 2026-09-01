import dateUtils from '@shared/utils/date';
import generateDiff from '@shared/utils/diff-generator';
import stringUtils from '@shared/utils/string';
import historyError from '@shared/values/history/history.error';

import ledgerAccountError from '@domain/ledger/errors/ledger-account.error';
import {
  ELedgerAccountAuditAction,
  ILedgerAccountAudit,
  IMakeLedgerAccountAuditPayload,
} from '@domain/ledger/types/ledger-account-audit.types';

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
    entityVersion: payload.after.version,
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
