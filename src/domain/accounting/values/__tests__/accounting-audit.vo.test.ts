import { TEntityId } from '@shared/types/uuid';
import generateUUID from '@shared/utils/uuid-generator';
import historyError from '@shared/values/history/history.error';

import accountingError from '@domain/accounting/errors/accounting.error';
import accountingAudit from '@domain/accounting/values/accounting-audit.vo';

const ETestActions = Object.freeze({
  Created: 'created',
  Updated: 'updated',
} as const);

type UTestAction = (typeof ETestActions)[keyof typeof ETestActions];

interface ITestSnapshot {
  id: TEntityId;
  name: string;
  updatedAt: Date;
}

describe('accountingAudit', () => {
  const makeSnapshot = (): ITestSnapshot => ({
    id: generateUUID(),
    name: 'Test Accounting Value',
    updatedAt: new Date('2026-04-15T00:00:00.000Z'),
  });

  it('is frozen', () => {
    expect(Object.isFrozen(accountingAudit)).toBe(true);
  });

  describe('make', () => {
    it('creates a frozen accounting audit with its inferred action type', () => {
      const after = makeSnapshot();

      const audit = accountingAudit.make(
        {
          before: null,
          after,
          action: ETestActions.Created,
        },
        ETestActions
      );
      const action: typeof ETestActions.Created = audit.action;

      expect(audit).toEqual({
        entityId: after.id,
        entityVersion: 1,
        action,
        diff: { before: null, after },
        occurredAt: after.updatedAt,
      });
      expect(Object.isFrozen(audit)).toBe(true);
    });

    it('captures changes between snapshots', () => {
      const before = makeSnapshot();
      const after: ITestSnapshot = {
        ...before,
        name: 'Updated Accounting Value',
        updatedAt: new Date('2026-04-16T00:00:00.000Z'),
      };

      const audit = accountingAudit.make(
        {
          before,
          after,
          action: ETestActions.Updated,
        },
        ETestActions
      );

      expect(audit.diff).toEqual({ before, after });
    });

    it('throws InvalidId when the entity ID is invalid', () => {
      const after = {
        ...makeSnapshot(),
        id: 'invalid-id' as TEntityId,
      };

      expect(() =>
        accountingAudit.make(
          { before: null, after, action: ETestActions.Created },
          ETestActions
        )
      ).toThrow(accountingError.InvalidId);
    });

    it('throws InvalidAction when the action is invalid', () => {
      const after = makeSnapshot();

      expect(() =>
        accountingAudit.make(
          {
            before: null,
            after,
            action: 'invalid-action' as UTestAction,
          },
          ETestActions
        )
      ).toThrow(accountingError.InvalidAction);
    });

    it('throws InvalidDate when the update date is invalid', () => {
      const after = {
        ...makeSnapshot(),
        updatedAt: new Date('invalid-date'),
      };

      expect(() =>
        accountingAudit.make(
          { before: null, after, action: ETestActions.Created },
          ETestActions
        )
      ).toThrow(accountingError.InvalidDate);
    });

    it('throws InvalidDiff when there are no changes', () => {
      const snapshot = makeSnapshot();

      expect(() =>
        accountingAudit.make(
          {
            before: snapshot,
            after: snapshot,
            action: ETestActions.Updated,
          },
          ETestActions
        )
      ).toThrow(historyError.InvalidDiff);
    });
  });
});
