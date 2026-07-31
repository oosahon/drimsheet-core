import dateUtils from '../../../shared/utils/date';
import generateDiff from '../../../shared/utils/diff-generator';
import stringUtils from '../../../shared/utils/string';
import historyError from '../../../shared/values/history/history.error';
import counterpartyError from '../errors/counterparty.error';
import {
  ECounterpartyEntityActions,
  ICounterpartyAudit,
  IMakeCounterpartyAuditPayload,
} from '../types/counterparty-audit.types';

function make(
  payload: IMakeCounterpartyAuditPayload
): Readonly<ICounterpartyAudit> {
  if (!payload || typeof payload !== 'object' || !payload.after) {
    throw new counterpartyError.InvalidCounterpartyPayload({ payload });
  }

  stringUtils.validateUUID(
    payload.after.id,
    counterpartyError.InvalidCounterpartyId
  );
  stringUtils.validateIsInEnum(
    payload.action,
    ECounterpartyEntityActions,
    counterpartyError.InvalidCounterpartyAction
  );
  dateUtils.validateDate(
    payload.after.updatedAt,
    counterpartyError.InvalidDate
  );

  const { before, after, hasChanges } = generateDiff(
    payload.after,
    payload.before
  );

  if (!hasChanges) {
    throw new historyError.InvalidDiff();
  }

  const audit: ICounterpartyAudit = {
    entityId: payload.after.id,
    action: payload.action,
    diff: { before, after },
    occurredAt: payload.after.updatedAt,
  };

  return Object.freeze(audit);
}

const counterpartyAuditValue = Object.freeze({
  make,
});

export default counterpartyAuditValue;
