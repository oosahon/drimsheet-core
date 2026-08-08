import dateUtils from '@shared/utils/date';
import generateDiff from '@shared/utils/diff-generator';
import stringUtils from '@shared/utils/string';
import historyError from '@shared/values/history/history.error';

import userError from '@domain/user/errors/user.error';
import {
  EUserEntityActions,
  IMakeUserAuditPayload,
  IUserAudit,
} from '@domain/user/types/user-audit.types';

function make(payload: IMakeUserAuditPayload) {
  stringUtils.validateUUID(payload.after.id, userError.InvalidId);
  stringUtils.validateIsInEnum(
    payload.action,
    EUserEntityActions,
    userError.InvalidAction
  );

  dateUtils.validateDate(payload.after.updatedAt, userError.InvalidDate);

  const { before, after, hasChanges } = generateDiff(
    payload.after,
    payload.before
  );

  if (!hasChanges) {
    throw new historyError.InvalidDiff();
  }

  const audit: IUserAudit = {
    entityId: payload.after.id,
    action: payload.action,
    diff: { before, after },
    occurredAt: payload.after.updatedAt,
  };

  return Object.freeze(audit);
}

const userAudit = Object.freeze({
  make,
});

export default userAudit;
