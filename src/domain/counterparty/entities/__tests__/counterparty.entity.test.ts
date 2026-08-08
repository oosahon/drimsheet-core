import { TEntityId } from '@shared/types/uuid';
import generateUUID from '@shared/utils/uuid-generator';

import counterpartyEntity from '@domain/counterparty/entities/counterparty.entity';
import counterpartyError from '@domain/counterparty/errors/counterparty.error';
import {
  ECounterpartyRole,
  ECounterpartyStatus,
  ECounterpartyType,
  IMakeCounterpartyPayload,
} from '@domain/counterparty/types/counterparty.types';

describe('Counterparty Entity', () => {
  const accountingEntityId = generateUUID();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-31T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('make', () => {
    it('should create a valid counterparty with empty roles array', () => {
      const payload: IMakeCounterpartyPayload = {
        accountingEntityId,
        name: '  Acme Corp  ',
        type: ECounterpartyType.Organization,
      };

      const [counterparty, events, audit] = counterpartyEntity.make(payload);

      expect(counterparty.accountingEntityId).toBe(accountingEntityId);
      expect(counterparty.name).toBe('Acme Corp');
      expect(counterparty.type).toBe(ECounterpartyType.Organization);
      expect(counterparty.status).toBe(ECounterpartyStatus.Active);
      expect(counterparty.roles).toEqual([]);
      expect(counterparty.createdAt).toEqual(
        new Date('2026-07-31T12:00:00.000Z')
      );
      expect(counterparty.updatedAt).toEqual(
        new Date('2026-07-31T12:00:00.000Z')
      );
      expect(Object.isFrozen(counterparty)).toBe(true);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('domain:counterparty:created');
      expect(events[0].data).toEqual(counterparty);

      expect(audit.entityId).toBe(counterparty.id);
      expect(audit.action).toBe('created');
      expect(audit.diff.before).toBeNull();
      expect(audit.diff.after).toEqual(counterparty);
    });

    it('should allow explicitly passing status', () => {
      const payload: IMakeCounterpartyPayload = {
        accountingEntityId,
        name: 'John Doe',
        type: ECounterpartyType.Individual,
        status: ECounterpartyStatus.Archived,
      };

      const [counterparty] = counterpartyEntity.make(payload);

      expect(counterparty.status).toBe(ECounterpartyStatus.Archived);
    });

    it('should throw InvalidAccountingEntityId if accountingEntityId is invalid', () => {
      const payload: IMakeCounterpartyPayload = {
        accountingEntityId: 'invalid-id' as TEntityId,
        name: 'Jane Doe',
        type: ECounterpartyType.Individual,
      };

      expect(() => counterpartyEntity.make(payload)).toThrow(
        counterpartyError.InvalidAccountingEntityId
      );
    });

    it('should throw InvalidName if name is empty', () => {
      const payload: IMakeCounterpartyPayload = {
        accountingEntityId,
        name: '',
        type: ECounterpartyType.Individual,
      };

      expect(() => counterpartyEntity.make(payload)).toThrow(
        counterpartyError.InvalidName
      );
    });
  });

  describe('addRole', () => {
    it('should add a role to the counterparty successfully', () => {
      const [initialCounterparty] = counterpartyEntity.make({
        accountingEntityId,
        name: 'Vendor Inc',
        type: ECounterpartyType.Organization,
      });

      jest.setSystemTime(new Date('2026-07-31T13:00:00.000Z'));

      const [updatedCounterparty, events, audit] = counterpartyEntity.addRole(
        initialCounterparty,
        ECounterpartyRole.Vendor
      );

      expect(updatedCounterparty.roles).toEqual([ECounterpartyRole.Vendor]);
      expect(updatedCounterparty.updatedAt).toEqual(
        new Date('2026-07-31T13:00:00.000Z')
      );
      expect(Object.isFrozen(updatedCounterparty)).toBe(true);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('domain:counterparty:role-added');
      expect(events[0].data).toEqual(updatedCounterparty);

      expect(audit.action).toBe('role-added');
      expect(audit.diff.before).toEqual(initialCounterparty);
      expect(audit.diff.after).toEqual(updatedCounterparty);
    });

    it('should throw RoleAlreadyAssigned if role is already assigned', () => {
      const [initialCounterparty] = counterpartyEntity.make({
        accountingEntityId,
        name: 'Vendor Inc',
        type: ECounterpartyType.Organization,
      });

      const [counterpartyWithRole] = counterpartyEntity.addRole(
        initialCounterparty,
        ECounterpartyRole.Vendor
      );

      expect(() =>
        counterpartyEntity.addRole(
          counterpartyWithRole,
          ECounterpartyRole.Vendor
        )
      ).toThrow(counterpartyError.RoleAlreadyAssigned);
    });

    it('should throw InvalidRole for invalid role', () => {
      const [initialCounterparty] = counterpartyEntity.make({
        accountingEntityId,
        name: 'Vendor Inc',
        type: ECounterpartyType.Organization,
      });

      expect(() =>
        counterpartyEntity.addRole(initialCounterparty, 'invalid-role' as any)
      ).toThrow(counterpartyError.InvalidRole);
    });
  });
});
