import historyError from '../errors/history.error';
import {
  EHistoryActorType,
  IEntityDelta,
  IHistory,
  IHistoryActor,
} from '../types/history.types';
import { TEntityId } from '../types/uuid';
import dateUtils from '../utils/date';
import stringUtils from '../utils/string';

function validateActor(actor: IHistoryActor) {
  const isValidActorType = Object.values(EHistoryActorType).includes(
    actor.type
  );

  if (!isValidActorType) {
    throw new historyError.InvalidActor({ actor });
  }

  if (actor.type === EHistoryActorType.User) {
    if (actor.userId === null) {
      throw new historyError.InvalidActor({ actor });
    }

    stringUtils.validateUUID(actor.userId, historyError.InvalidActor);
    return;
  }

  if (actor.userId !== null) {
    throw new historyError.InvalidActor({ actor });
  }
}

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
  actor: IHistoryActor,
  correlationId: string
): IHistory<T> {
  stringUtils.validateUUID(delta.entityId, historyError.InvalidEntityId);
  stringUtils.validateIsNonEmptyString(
    delta.action,
    historyError.InvalidAction
  );
  validateSnapshots(delta.diff.before, delta.diff.after);
  dateUtils.validateDate(delta.occurredAt, historyError.InvalidDate);
  validateActor(actor);
  stringUtils.validateIsNonEmptyString(
    delta.action,
    historyError.InvalidCorrelationId
  );

  const history: IHistory<T> = {
    entityId: delta.entityId,
    action: delta.action,
    diff: delta.diff,
    occurredAt: delta.occurredAt,
    actor: actor,
    correlationId,
  };

  return Object.freeze(history);
}

function getUserActor(userId: TEntityId): IHistoryActor {
  stringUtils.validateUUID(userId, historyError.InvalidActor);
  return {
    userId,
    type: EHistoryActorType.User,
  };
}

function getSystemActor(): IHistoryActor {
  return {
    userId: null,
    type: EHistoryActorType.System,
  };
}

function getMigrationActor(): IHistoryActor {
  return {
    userId: null,
    type: EHistoryActorType.Migration,
  };
}

const historyValue = Object.freeze({
  make,
  getUserActor,
  getSystemActor,
  getMigrationActor,
});

export default historyValue;
