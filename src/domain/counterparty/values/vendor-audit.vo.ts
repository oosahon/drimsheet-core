import dateUtils from '../../../shared/utils/date';
import generateDiff from '../../../shared/utils/diff-generator';
import stringUtils from '../../../shared/utils/string';
import historyError from '../../../shared/values/history/history.error';
import counterpartyError from '../errors/counterparty.error';
import {
  EVendorHistoryAction,
  IMakeVendorAuditPayload,
  IVendorAudit,
} from '../types/counterparty-audit.types';

function make(payload: IMakeVendorAuditPayload): Readonly<IVendorAudit> {
  if (!payload || typeof payload !== 'object' || !payload.after) {
    throw new counterpartyError.InvalidCounterpartyPayload({ payload });
  }

  stringUtils.validateUUID(
    payload.after.counterpartyId,
    counterpartyError.InvalidCounterpartyId
  );
  stringUtils.validateIsInEnum(
    payload.action,
    EVendorHistoryAction,
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

  const audit: IVendorAudit = {
    entityId: payload.after.counterpartyId,
    action: payload.action,
    diff: { before, after },
    occurredAt: payload.after.createdAt,
  };

  return Object.freeze(audit);
}

const vendorAuditValue = Object.freeze({
  make,
});

export default vendorAuditValue;
