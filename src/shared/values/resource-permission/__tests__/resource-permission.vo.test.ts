import { TEntityId } from '@shared/types/uuid';
import resourcePermissionValue from '@shared/values/resource-permission/resource-permission.vo';

describe('Resource permission value', () => {
  const accountingEntity = '123e4567-e89b-42d3-a456-426614174000' as TEntityId;

  describe('make', () => {
    it('serializes a resource permission without a state qualifier', () => {
      const permission = {
        accountingEntity,
        entityName: 'ledger',
        action: 'read',
      };

      expect(resourcePermissionValue.make(permission)).toBe(
        `${accountingEntity}::ledger::read`
      );
    });

    it('appends the state qualifier using a single colon', () => {
      const permission = Object.freeze({
        accountingEntity,
        entityName: 'journal_entries',
        action: 'archive',
        state: 'posted',
      });

      expect(resourcePermissionValue.make(permission)).toBe(
        `${accountingEntity}::journal_entries::archive:posted`
      );
    });

    it('omits the qualifier when state is explicitly undefined', () => {
      expect(
        resourcePermissionValue.make({
          accountingEntity,
          entityName: 'accounting_entity',
          action: 'read',
          state: undefined,
        })
      ).toBe(`${accountingEntity}::accounting_entity::read`);
    });
  });
});
