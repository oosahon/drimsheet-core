import { TEntityId } from '../../../../shared/types/uuid';
import generateUUID from '../../../../shared/utils/uuid-generator';
import historyError from '../../../../shared/values/history/history.error';
import { SYSTEM_CURRENCIES } from '../../../money/config/currencies.config';
import accountingEntityEntity from '../../entities/accounting-entity.entity';
import accountingError from '../../errors/accounting.error';
import {
  EAccountingEntityActions,
  UAccountingEntityActions,
} from '../../types/accounting-entity-audit.types';
import { EAccountingEntityType } from '../../types/accounting-entity.types';
import accountingEntityAudit from '../accounting-entity-audit.vo';

describe('accountingEntityAudit', () => {
  const makeAccountingEntity = () =>
    accountingEntityEntity.make({
      name: 'Test Accounting Entity',
      type: EAccountingEntityType.Individual,
      ownerId: generateUUID(),
      functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
      jurisdictionCode: 'NG',
    })[0];

  describe('make', () => {
    it('creates an accounting entity audit', () => {
      const accountingEntity = makeAccountingEntity();

      const audit = accountingEntityAudit.make({
        before: null,
        after: accountingEntity,
        action: EAccountingEntityActions.Created,
      });

      expect(audit).toEqual({
        entityId: accountingEntity.id,
        action: EAccountingEntityActions.Created,
        diff: {
          before: null,
          after: accountingEntity,
        },
        occurredAt: accountingEntity.updatedAt,
      });
      expect(Object.isFrozen(audit)).toBe(true);
    });

    it('throws accountingError.InvalidId if the entity ID is invalid', () => {
      const accountingEntity = makeAccountingEntity();

      expect(() =>
        accountingEntityAudit.make({
          before: null,
          after: {
            ...accountingEntity,
            id: 'invalid-id' as TEntityId,
          },
          action: EAccountingEntityActions.Created,
        })
      ).toThrow(accountingError.InvalidId);
    });

    it('throws accountingError.InvalidAction if the action is invalid', () => {
      const accountingEntity = makeAccountingEntity();

      expect(() =>
        accountingEntityAudit.make({
          before: null,
          after: accountingEntity,
          action: 'invalid-action' as UAccountingEntityActions,
        })
      ).toThrow(accountingError.InvalidAction);
    });

    it('throws accountingError.InvalidDate if updatedAt is invalid', () => {
      const accountingEntity = makeAccountingEntity();

      expect(() =>
        accountingEntityAudit.make({
          before: null,
          after: {
            ...accountingEntity,
            updatedAt: new Date('invalid-date'),
          },
          action: EAccountingEntityActions.Created,
        })
      ).toThrow(accountingError.InvalidDate);
    });

    it('throws historyError.InvalidDiff if there are no changes', () => {
      const accountingEntity = makeAccountingEntity();

      expect(() =>
        accountingEntityAudit.make({
          before: accountingEntity,
          after: accountingEntity,
          action: EAccountingEntityActions.Created,
        })
      ).toThrow(historyError.InvalidDiff);
    });
  });
});
