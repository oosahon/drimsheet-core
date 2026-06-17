import historyError from '../../../../shared/errors/history.error';
import { IEntityDelta } from '../../../../shared/types/history.types';
import { TEntityId } from '../../../../shared/types/uuid';
import dateUtils from '../../../../shared/utils/date';
import generateDiff from '../../../../shared/utils/diff-generator';
import stringUtils from '../../../../shared/utils/string';
import accountingError from '../../errors/accounting.error';

interface IAuditableEntity {
  id: TEntityId;
  updatedAt: Date;
}

interface IMakeAccountingAuditPayload<
  TSnapshot extends IAuditableEntity,
  TAction extends string,
> {
  before: TSnapshot | null;
  after: TSnapshot;
  action: TAction;
}

function make<TSnapshot extends IAuditableEntity, TAction extends string>(
  payload: IMakeAccountingAuditPayload<TSnapshot, TAction>,
  actions: object
): IEntityDelta<TSnapshot> & { action: TAction } {
  stringUtils.validateUUID(payload.after.id, accountingError.InvalidId);
  stringUtils.validateIsInEnum(
    payload.action,
    actions,
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

  return Object.freeze({
    entityId: payload.after.id,
    action: payload.action,
    diff: { before, after },
    occurredAt: payload.after.updatedAt,
  });
}

const accountingAuditHelpers = Object.freeze({
  make,
});

export default accountingAuditHelpers;
