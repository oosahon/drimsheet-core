import { TEntityId } from '../../../../shared/types/uuid';
import generateUUID from '../../../../shared/utils/uuid-generator';
import historyError from '../../../../shared/values/history/history.error';
import counterpartyError from '../../errors/counterparty.error';
import { ECounterpartyEntityActions } from '../../types/counterparty-audit.types';
import {
  ECounterpartyStatus,
  ECounterpartyType,
  ICounterparty,
} from '../../types/counterparty.types';
import counterpartyAuditValue from '../counterparty-audit.vo';

describe('counterpartyAuditValue', () => {
  const counterpartyId = generateUUID();
  const accountingEntityId = generateUUID();

  const mockCounterparty: ICounterparty = Object.freeze({
    id: counterpartyId,
    accountingEntityId,
    name: 'Acme Corp',
    status: ECounterpartyStatus.Active,
    type: ECounterpartyType.Organization,
    roles: [],
    createdAt: new Date('2026-07-31T12:00:00.000Z'),
    updatedAt: new Date('2026-07-31T12:00:00.000Z'),
  });

  describe('make', () => {
    it('should create audit record for creation action', () => {
      const audit = counterpartyAuditValue.make({
        before: null,
        after: mockCounterparty,
        action: ECounterpartyEntityActions.Created,
      });

      expect(audit.entityId).toBe(counterpartyId);
      expect(audit.action).toBe(ECounterpartyEntityActions.Created);
      expect(audit.diff.before).toBeNull();
      expect(audit.diff.after).toEqual(mockCounterparty);
      expect(audit.occurredAt).toEqual(mockCounterparty.updatedAt);
      expect(Object.isFrozen(audit)).toBe(true);
    });

    it('should throw InvalidDiff if before and after are identical', () => {
      expect(() =>
        counterpartyAuditValue.make({
          before: mockCounterparty,
          after: mockCounterparty,
          action: ECounterpartyEntityActions.RoleAdded,
        })
      ).toThrow(historyError.InvalidDiff);
    });

    it('should throw InvalidCounterpartyId if after entity has invalid id', () => {
      const invalidEntity: ICounterparty = Object.freeze({
        id: 'invalid-id' as TEntityId,
        accountingEntityId: mockCounterparty.accountingEntityId,
        name: mockCounterparty.name,
        status: mockCounterparty.status,
        type: mockCounterparty.type,
        roles: mockCounterparty.roles,
        createdAt: mockCounterparty.createdAt,
        updatedAt: mockCounterparty.updatedAt,
      });

      expect(() =>
        counterpartyAuditValue.make({
          before: null,
          after: invalidEntity,
          action: ECounterpartyEntityActions.Created,
        })
      ).toThrow(counterpartyError.InvalidCounterpartyId);
    });
  });
});
