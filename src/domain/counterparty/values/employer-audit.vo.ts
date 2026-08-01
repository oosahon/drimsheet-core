import dateUtils from '../../../shared/utils/date';
import generateDiff from '../../../shared/utils/diff-generator';
import stringUtils from '../../../shared/utils/string';
import historyError from '../../../shared/values/history/history.error';
import counterpartyError from '../errors/counterparty.error';
import {
  EEmployerHistoryAction,
  IEmployerAudit,
  IMakeEmployerAuditPayload,
} from '../types/counterparty-audit.types';

function make(payload: IMakeEmployerAuditPayload): Readonly<IEmployerAudit> {
  if (!payload || typeof payload !== 'object' || !payload.after) {
    throw new counterpartyError.InvalidCounterpartyPayload({ payload });
  }

  stringUtils.validateUUID(
    payload.after.counterPartyId,
    counterpartyError.InvalidCounterpartyId
  );
  stringUtils.validateIsInEnum(
    payload.action,
    EEmployerHistoryAction,
    counterpartyError.InvalidCounterpartyAction
  );
  dateUtils.validateDate(
    payload.after.createdAt,
    counterpartyError.InvalidDate
  );

  const { before, after, hasChanges } = generateDiff(
    payload.after,
    payload.before
  );

  if (!hasChanges) {
    throw new historyError.InvalidDiff();
  }

  const audit: IEmployerAudit = {
    entityId: payload.after.counterPartyId,
    action: payload.action,
    diff: { before, after },
    occurredAt: payload.after.createdAt,
  };

  return Object.freeze(audit);
}

const employerAuditValue = Object.freeze({
  make,
});

export default employerAuditValue;
