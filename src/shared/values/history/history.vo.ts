import { TEntityId } from '@shared/types/uuid';
import dateUtils from '@shared/utils/date';
import numberUtils from '@shared/utils/number';
import safeJSON from '@shared/utils/safe-json';
import stringUtils from '@shared/utils/string';
import {
  IEntityDelta,
  IHistory,
} from '@shared/values/history/types/history.types';

import historyError from './history.error';

function isSnapshot(value: unknown): value is object {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0
  );
}

function validateSnapshots<TSnapshot extends object>(
  before: TSnapshot | null,
  after: TSnapshot
) {
  if (!isSnapshot(after)) {
    throw new historyError.InvalidDiff({ before, after });
  }

  if (before === null) {
    return;
  }

  if (!isSnapshot(before)) {
    throw new historyError.InvalidDiff({ before, after });
  }
}

function make<T extends object>(
  delta: IEntityDelta<T>,
  actorId: TEntityId,
  correlationId: string,
  onBehalfOf: TEntityId | null = null
): IHistory<T> {
  stringUtils.validateUUID(delta.entityId, historyError.InvalidEntityId);

  const isInvalidEntityVersion =
    typeof delta.entityVersion !== 'number' ||
    !numberUtils.isInteger(delta.entityVersion) ||
    !numberUtils.isPositiveNumber(delta.entityVersion);

  if (isInvalidEntityVersion) {
    throw new historyError.InvalidEntityVersion({
      entityVersion: delta.entityVersion,
    });
  }
  stringUtils.validateIsNonEmptyString(
    delta.action,
    historyError.InvalidAction
  );
  validateSnapshots(delta.diff.before, delta.diff.after);
  dateUtils.validateDate(delta.occurredAt, historyError.InvalidDate);
  stringUtils.validateUUID(actorId, historyError.InvalidActorId);
  if (onBehalfOf !== null) {
    stringUtils.validateUUID(onBehalfOf, historyError.InvalidOnBehalfOf);
  }
  stringUtils.validateIsNonEmptyString(
    correlationId,
    historyError.InvalidCorrelationId
  );

  const history: IHistory<T> = {
    entityId: delta.entityId,
    entityVersion: delta.entityVersion,
    action: delta.action,
    diff: safeJSON.normalize(delta.diff),
    occurredAt: delta.occurredAt,
    actorId,
    onBehalfOf,
    correlationId,
  };

  return Object.freeze(history);
}

const historyValue = Object.freeze({
  make,
});

export default historyValue;
