import { TEntityId } from '@shared/types/uuid';
import historyError from '@shared/values/history/history.error';
import historyValue from '@shared/values/history/history.vo';

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

const userActor = userId;

const correlationId = '854e4567-e89b-42d3-a456-426614174001';

function makeHistory(
  actorId: TEntityId,
  action: string,
  beforeSnapshot: ITestSnapshot | null,
  afterSnapshot: ITestSnapshot,
  occurredAt: Date = new Date()
) {
  return historyValue.make(
    {
      entityId,
      entityVersion: 1,
      action,
      diff: {
        before: beforeSnapshot,
        after: afterSnapshot,
      },
      occurredAt,
    },
    actorId,
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
      expect(history.entityVersion).toBe(1);
      expect(history.actorId).toBe(userActor);
      expect(history.action).toBe('updated');
      expect(history.diff).toEqual({ before, after });
      expect(history.occurredAt).toBe(occurredAt);
      expect(history.correlationId).toBe(correlationId);
      expect(Object.isFrozen(history)).toBe(true);

      // Verify removed fields are not present
      expect(history).not.toHaveProperty('id');
      expect(history).not.toHaveProperty('note');
    });

    it.each([
      userActor,
      entityId,
      'b2222222-2222-4222-8222-222222222222' as TEntityId,
      'c3333333-3333-4333-8333-333333333333' as TEntityId,
    ])('retains the supplied $type actor', (actor) => {
      const history = makeHistory(actor, 'created', null, after);
      expect(history.actorId).toBe(actor);
      expect(history.actorId).toEqual(actor);
    });

    it('rejects invalid entity IDs', () => {
      expect(() =>
        historyValue.make(
          {
            entityId: 'invalid' as TEntityId,
            entityVersion: 1,
            action: 'updated',
            diff: { before, after },
            occurredAt: new Date(),
          },
          userActor,
          correlationId
        )
      ).toThrow(historyError.InvalidEntityId);
    });

    it.each([undefined, 0, -1, 1.5])(
      'rejects invalid entity version %s',
      (entityVersion) => {
        expect(() =>
          historyValue.make(
            {
              entityId,
              entityVersion,
              action: 'updated',
              diff: { before, after },
              occurredAt: new Date(),
            } as unknown as Parameters<typeof historyValue.make>[0],
            userActor,
            correlationId
          )
        ).toThrow(historyError.InvalidEntityVersion);
      }
    );

    it.each([null, undefined, '', 'invalid', {}])(
      'rejects invalid actors with history errors: %p',
      (actor) => {
        expect(() =>
          makeHistory(actor as unknown as TEntityId, 'updated', before, after)
        ).toThrow(historyError.InvalidActorId);
      }
    );

    it('keeps delegation only on the history, with UUID validation', () => {
      const delta = {
        entityId,
        entityVersion: 1,
        action: 'created',
        diff: { before: null, after },
        occurredAt: new Date(),
      };
      const history = historyValue.make(delta, userId, correlationId, entityId);
      expect(history.onBehalfOf).toBe(entityId);
      expect(history.diff.after).not.toHaveProperty('onBehalfOf');
      expect(
        historyValue.make(delta, userId, correlationId).onBehalfOf
      ).toBeNull();
      expect(() =>
        historyValue.make(delta, userId, correlationId, 'invalid' as TEntityId)
      ).toThrow(historyError.InvalidOnBehalfOf);
    });

    it('rejects invalid actions', () => {
      expect(() =>
        historyValue.make(
          {
            entityId,
            entityVersion: 1,
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
            entityVersion: 1,
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
            entityVersion: 1,
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
            entityVersion: 1,
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
});
