import historyError from '../../errors/history.error';
import { EHistoryActorType, IHistoryActor } from '../../types/history.types';
import { TEntityId } from '../../types/uuid';
import stringUtils from '../../utils/string';
import historyValue from '../history.vo';

interface ITestSnapshot {
  id: TEntityId;
  name: string;
}

const ETestHistoryAction = {
  Created: 'created',
  Updated: 'updated',
} as const;

type UTestHistoryAction =
  (typeof ETestHistoryAction)[keyof typeof ETestHistoryAction];

const entityId = '123e4567-e89b-42d3-a456-426614174000' as TEntityId;
const userId = '987fcdeb-51a2-43d7-9012-3456789abcde' as TEntityId;

const before: ITestSnapshot = {
  id: entityId,
  name: 'Before',
};

const after: ITestSnapshot = {
  id: entityId,
  name: 'After',
};

const userActor: IHistoryActor = {
  type: EHistoryActorType.User,
  userId,
};

function makeHistory(
  actor: IHistoryActor,
  action: UTestHistoryAction,
  beforeSnapshot: ITestSnapshot | null,
  afterSnapshot: ITestSnapshot,
  note: string | null
) {
  return historyValue.make(
    {
      entityId,
      actor,
      action,
      before: beforeSnapshot,
      after: afterSnapshot,
      note,
    },
    ETestHistoryAction
  );
}

describe('history.vo', () => {
  describe('make', () => {
    it('creates a frozen history record', () => {
      const earliestTimestamp = Date.now();
      const history = makeHistory(
        userActor,
        'updated',
        before,
        after,
        'Changed the name'
      );

      expect(stringUtils.isUUID(history.id)).toBe(true);
      expect(history.entityId).toBe(entityId);
      expect(history.actor).toBe(userActor);
      expect(history.action).toBe('updated');
      expect(history.diff).toEqual({ before, after });
      expect(history.diff).not.toHaveProperty('hasChanges');
      expect(history.note).toBe('Changed the name');
      expect(history.occurredAt.getTime()).toBeGreaterThanOrEqual(
        earliestTimestamp
      );
      expect(Object.isFrozen(history)).toBe(true);
    });

    it('creates history for system and migration actors', () => {
      const systemHistory = makeHistory(
        {
          type: EHistoryActorType.System,
          userId: null,
        },
        'created',
        null,
        after,
        null
      );
      const migrationHistory = makeHistory(
        {
          type: EHistoryActorType.Migration,
          userId: null,
        },
        'created',
        null,
        after,
        null
      );

      expect(systemHistory.actor.type).toBe(EHistoryActorType.System);
      expect(migrationHistory.actor.type).toBe(EHistoryActorType.Migration);
    });

    it('preserves valid actions and sanitizes notes', () => {
      const history = makeHistory(
        userActor,
        ETestHistoryAction.Updated,
        before,
        after,
        '  Changed the name  '
      );

      expect(history.action).toBe('updated');
      expect(history.note).toBe('Changed the name');
    });

    it('rejects invalid entity IDs', () => {
      expect(() =>
        historyValue.make(
          {
            entityId: 'invalid' as TEntityId,
            actor: userActor,
            action: ETestHistoryAction.Updated,
            before,
            after,
            note: null,
          },
          ETestHistoryAction
        )
      ).toThrow(historyError.InvalidEntityId);
    });

    it('rejects invalid actors', () => {
      const invalidActors: IHistoryActor[] = [
        {
          type: EHistoryActorType.User,
          userId: null,
        },
        {
          type: EHistoryActorType.User,
          userId: 'invalid' as TEntityId,
        },
        {
          type: EHistoryActorType.System,
          userId,
        },
        {
          type: 'unknown',
          userId: null,
        } as unknown as IHistoryActor,
      ];

      for (const actor of invalidActors) {
        expect(() =>
          makeHistory(actor, ETestHistoryAction.Updated, before, after, null)
        ).toThrow(historyError.InvalidActor);
      }
    });

    it('rejects invalid actions', () => {
      expect(() =>
        makeHistory(
          userActor,
          'deleted' as UTestHistoryAction,
          before,
          after,
          null
        )
      ).toThrow(historyError.InvalidAction);
    });

    it('rejects unchanged and malformed diffs', () => {
      const invalidSnapshots: [unknown, unknown][] = [
        [before, null],
        [before, []],
        [[], after],
        [before, before],
        [null, {}],
      ];

      for (const [invalidBefore, invalidAfter] of invalidSnapshots) {
        expect(() =>
          makeHistory(
            userActor,
            ETestHistoryAction.Updated,
            invalidBefore as ITestSnapshot | null,
            invalidAfter as ITestSnapshot,
            null
          )
        ).toThrow(historyError.InvalidDiff);
      }
    });

    it('rejects invalid notes', () => {
      expect(() =>
        makeHistory(userActor, ETestHistoryAction.Updated, before, after, '   ')
      ).toThrow(historyError.InvalidNote);
      expect(() =>
        makeHistory(
          userActor,
          ETestHistoryAction.Updated,
          before,
          after,
          'a'.repeat(1001)
        )
      ).toThrow(historyError.InvalidNote);
    });
  });
});
