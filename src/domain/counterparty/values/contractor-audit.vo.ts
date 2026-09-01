import dateUtils from '@shared/utils/date';
import generateDiff from '@shared/utils/diff-generator';
import stringUtils from '@shared/utils/string';
import historyError from '@shared/values/history/history.error';

import counterpartyError from '@domain/counterparty/errors/counterparty.error';
import {
  EContractorHistoryAction,
  IContractorAudit,
  IMakeContractorAuditPayload,
} from '@domain/counterparty/types/counterparty-audit.types';

function make(
  payload: IMakeContractorAuditPayload
): Readonly<IContractorAudit> {
  if (!payload || typeof payload !== 'object' || !payload.after) {
    throw new counterpartyError.InvalidCounterpartyPayload({ payload });
  }

  stringUtils.validateUUID(
    payload.after.counterpartyId,
    counterpartyError.InvalidCounterpartyId
  );
  stringUtils.validateIsInEnum(
    payload.action,
    EContractorHistoryAction,
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

  const audit: IContractorAudit = {
    entityId: payload.after.counterpartyId,
    entityVersion: 1,
    action: payload.action,
    diff: { before, after },
    occurredAt: payload.after.createdAt,
  };

  return Object.freeze(audit);
}

const contractorAuditValue = Object.freeze({
  make,
});

export default contractorAuditValue;
