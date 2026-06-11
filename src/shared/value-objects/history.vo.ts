import historyError from '../errors/history.error';
import { IDiff } from '../types/diff.types';
import {
  EHistoryActorType,
  IHistoryActor,
  IHistoryRecord,
} from '../types/history.types';
import generateDiff from '../utils/diff-generator';
import stringUtils from '../utils/string';
import generateUUID from '../utils/uuid-generator';

const MAX_NOTE_LENGTH = 1000;

interface IMakeHistoryPayload<
  TSnapshot extends object,
  TAction extends string,
> extends IDiff<TSnapshot> {
  entityId: IHistoryRecord<TSnapshot, TAction>['entityId'];
  actor: IHistoryRecord<TSnapshot, TAction>['actor'];
  action: IHistoryRecord<TSnapshot, TAction>['action'];
  note: IHistoryRecord<TSnapshot, TAction>['note'];
}

type THistoryActions<TAction extends string> = Readonly<
  Record<string, TAction>
>;

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

function validateAction<TAction extends string>(
  action: TAction,
  actions: THistoryActions<TAction>
) {
  if (!Object.values(actions).includes(action)) {
    throw new historyError.InvalidAction({ action });
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

function sanitizeNote(note: string | null): string | null {
  if (note === null) {
    return null;
  }

  return stringUtils.sanitizeAndValidate(
    note,
    { min: 1, max: MAX_NOTE_LENGTH },
    historyError.InvalidNote
  );
}

function make<TSnapshot extends object, TAction extends string>(
  payload: IMakeHistoryPayload<TSnapshot, TAction>,
  actions: THistoryActions<TAction>
): IHistoryRecord<TSnapshot, TAction> {
  stringUtils.validateUUID(payload.entityId, historyError.InvalidEntityId);
  validateActor(payload.actor);
  validateAction(payload.action, actions);
  validateSnapshots(payload.before, payload.after);

  const generatedDiff = generateDiff(payload.after, payload.before);

  if (!generatedDiff.hasChanges) {
    throw new historyError.InvalidDiff({
      before: payload.before,
      after: payload.after,
    });
  }

  return Object.freeze({
    id: generateUUID(),
    entityId: payload.entityId,
    actor: payload.actor,
    action: payload.action,
    diff: {
      before: generatedDiff.before,
      after: generatedDiff.after,
    },
    note: sanitizeNote(payload.note),
    occurredAt: new Date(),
  });
}

const historyValue = Object.freeze({
  make,
});

export default historyValue;
