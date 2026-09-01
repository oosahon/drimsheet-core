import dateUtils from '@shared/utils/date';
import generateDiff from '@shared/utils/diff-generator';
import stringUtils from '@shared/utils/string';
import historyError from '@shared/values/history/history.error';

import accountingError from '@domain/accounting/errors/accounting.error';
import {
  EAccountingContextActions,
  IAccountingContextAudit,
  IMakeAccountingContextAuditPayload,
} from '@domain/accounting/types/accounting-context-audit.types';

function make(payload: IMakeAccountingContextAuditPayload) {
  stringUtils.validateUUID(payload.after.id, accountingError.InvalidId);
  stringUtils.validateIsInEnum(
    payload.action,
    EAccountingContextActions,
    accountingError.InvalidAction
  );
  dateUtils.validateDate(payload.after.updatedAt, accountingError.InvalidDate);

  const { before, after, hasChanges } = generateDiff(
    payload.after,
    payload.before
  );

  if (!hasChanges) {
    throw new historyError.InvalidDiff();
  }

  const audit: IAccountingContextAudit = {
    entityId: payload.after.id,
    entityVersion: 1,
    action: payload.action,
    diff: { before, after },
    occurredAt: payload.after.updatedAt,
  };

  return Object.freeze(audit);
}

const accountingContextAudit = Object.freeze({
  make,
});

export default accountingContextAudit;
