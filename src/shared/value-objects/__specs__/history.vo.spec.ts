import historyError from '../../errors/history.error';
import { EHistoryActorType, IHistoryActor } from '../../types/history.types';
import { TEntityId } from '../../types/uuid';
import historyValue from '../history.vo';

interface ITestSnapshot {
  id: TEntityId;
  name: string;
}

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

const correlationId = '854e4567-e89b-42d3-a456-426614174001';

function makeHistory(
  actor: IHistoryActor,
  action: string,
  beforeSnapshot: ITestSnapshot | null,
  afterSnapshot: ITestSnapshot,
  occurredAt: Date = new Date()
) {
  return historyValue.make(
    {
      entityId,
      action,
      diff: {
        before: beforeSnapshot,
        after: afterSnapshot,
      },
      occurredAt,
    },
    actor,
    correlationId
  );
}

describe('history.vo', () => {
  describe('make', () => {
    it('creates a frozen history record', () => {
      const occurredAt = new Date();
      const history = makeHistory(
        userActor,
        'updated',
        before,
        after,
        occurredAt
      );

      expect(history.entityId).toBe(entityId);
      expect(history.actor).toBe(userActor);
      expect(history.action).toBe('updated');
      expect(history.diff).toEqual({ before, after });
      expect(history.occurredAt).toBe(occurredAt);
      expect(history.correlationId).toBe(correlationId);
      expect(Object.isFrozen(history)).toBe(true);

      // Verify removed fields are not present
      expect(history).not.toHaveProperty('id');
      expect(history).not.toHaveProperty('note');
    });

    it('creates history for system and migration actors', () => {
      const systemHistory = makeHistory(
        {
          type: EHistoryActorType.System,
          userId: null,
        },
        'created',
        null,
        after
      );
      const migrationHistory = makeHistory(
        {
          type: EHistoryActorType.Migration,
          userId: null,
        },
        'created',
        null,
        after
      );

      expect(systemHistory.actor.type).toBe(EHistoryActorType.System);
      expect(migrationHistory.actor.type).toBe(EHistoryActorType.Migration);
    });

    it('rejects invalid entity IDs', () => {
      expect(() =>
        historyValue.make(
          {
            entityId: 'invalid' as TEntityId,
            action: 'updated',
            diff: { before, after },
            occurredAt: new Date(),
          },
          userActor,
          correlationId
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
        expect(() => makeHistory(actor, 'updated', before, after)).toThrow(
          historyError.InvalidActor
        );
      }
    });

    it('rejects invalid actions', () => {
      expect(() =>
        historyValue.make(
          {
            entityId,
            action: '   ',
            diff: { before, after },
            occurredAt: new Date(),
          },
          userActor,
          correlationId
        )
      ).toThrow(historyError.InvalidAction);

      expect(() =>
        historyValue.make(
          {
            entityId,
            action: '',
            diff: { before, after },
            occurredAt: new Date(),
          },
          userActor,
          correlationId
        )
      ).toThrow(historyError.InvalidAction);
    });

    it('rejects invalid dates', () => {
      expect(() =>
        historyValue.make(
          {
            entityId,
            action: 'updated',
            diff: { before, after },
            occurredAt: new Date('invalid'),
          },
          userActor,
          correlationId
        )
      ).toThrow(historyError.InvalidDate);
    });

    it('rejects invalid correlation IDs', () => {
      expect(() =>
        historyValue.make(
          {
            entityId,
            action: 'updated',
            diff: { before, after },
            occurredAt: new Date(),
          },
          userActor,
          ''
        )
      ).toThrow(historyError.InvalidCorrelationId);
    });

    it('rejects invalid diffs', () => {
      const invalidSnapshots: [unknown, unknown][] = [
        [before, null],
        [before, []],
        [[], after],
        [null, {}],
        [before, {}],
        [{}, after],
      ];

      for (const [invalidBefore, invalidAfter] of invalidSnapshots) {
        expect(() =>
          makeHistory(
            userActor,
            'updated',
            invalidBefore as ITestSnapshot | null,
            invalidAfter as ITestSnapshot
          )
        ).toThrow(historyError.InvalidDiff);
      }
    });
  });

  describe('helpers', () => {
    it('getUserActor returns valid user actor and validates userId', () => {
      const actor = historyValue.getUserActor(userId);
      expect(actor).toEqual({
        userId,
        type: EHistoryActorType.User,
      });

      expect(() =>
        historyValue.getUserActor('invalid-uuid' as TEntityId)
      ).toThrow(historyError.InvalidActor);
    });

    it('getSystemActor returns system actor', () => {
      const actor = historyValue.getSystemActor();
      expect(actor).toEqual({
        userId: null,
        type: EHistoryActorType.System,
      });
    });

    it('getMigrationActor returns migration actor', () => {
      const actor = historyValue.getMigrationActor();
      expect(actor).toEqual({
        userId: null,
        type: EHistoryActorType.Migration,
      });
    });
  });
});
