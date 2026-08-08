import { TEntityId } from '@shared/types/uuid';
import historyError from '@shared/values/history/history.error';

import userEntity from '@domain/user/entities/user.entity';
import userError from '@domain/user/errors/user.error';
import { EUserEntityActions } from '@domain/user/types/user-audit.types';
import userAudit from '@domain/user/values/user-audit.vo';

describe('userAudit', () => {
  describe('make', () => {
    it('successfully creates a user audit record for user creation', () => {
      const [user] = userEntity.make({
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: false,
      });

      const audit = userAudit.make({
        before: null,
        after: user,
        action: EUserEntityActions.Created,
      });

      expect(audit.entityId).toBe(user.id);
      expect(audit.action).toBe(EUserEntityActions.Created);
      expect(audit.occurredAt).toBe(user.updatedAt);
      expect(audit.diff.before).toBeNull();
      expect(audit.diff.after).toEqual(user);
      expect(Object.isFrozen(audit)).toBe(true);
    });

    it('successfully creates a user audit record for user updates', () => {
      const [user] = userEntity.make({
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: false,
      });

      const [updatedUser] = userEntity.update(user, {
        firstName: 'Johnny',
      });

      const audit = userAudit.make({
        before: user,
        after: updatedUser,
        action: EUserEntityActions.Updated,
      });

      expect(audit.entityId).toBe(user.id);
      expect(audit.action).toBe(EUserEntityActions.Updated);
      expect(audit.diff.before).toEqual(user);
      expect(audit.diff.after).toEqual(updatedUser);
    });

    it('throws userError.InvalidId if user ID is invalid', () => {
      const [user] = userEntity.make({
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: false,
      });

      const invalidUser = {
        ...user,
        id: 'invalid-id' as TEntityId,
      };

      expect(() =>
        userAudit.make({
          before: null,
          after: invalidUser,
          action: EUserEntityActions.Created,
        })
      ).toThrow(userError.InvalidId);
    });

    it('throws userError.InvalidAction if action is invalid', () => {
      const [user] = userEntity.make({
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: false,
      });

      expect(() =>
        userAudit.make({
          before: null,
          after: user,
          action: 'invalid-action' as any,
        })
      ).toThrow(userError.InvalidAction);
    });

    it('throws userError.InvalidDate if updatedAt is not a valid Date', () => {
      const [user] = userEntity.make({
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: false,
      });

      const invalidUser = {
        ...user,
        updatedAt: new Date('invalid-date'),
      };

      expect(() =>
        userAudit.make({
          before: null,
          after: invalidUser,
          action: EUserEntityActions.Created,
        })
      ).toThrow(userError.InvalidDate);
    });

    it('throws historyError.InvalidDiff if there are no changes between before and after', () => {
      const [user] = userEntity.make({
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: false,
      });

      expect(() =>
        userAudit.make({
          before: user,
          after: user,
          action: EUserEntityActions.Updated,
        })
      ).toThrow(historyError.InvalidDiff);
    });
  });
});
