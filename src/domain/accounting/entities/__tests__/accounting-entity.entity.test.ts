import { TCreationOmits } from '@shared/types/creation-omits.types';
import generateUUID from '@shared/utils/uuid-generator';

import accountingEntityEntity from '@domain/accounting/entities/accounting-entity.entity';
import accountingEntityValidation from '@domain/accounting/entities/validations/accounting-entity.validation';
import { EAccountingEntityEvents } from '@domain/accounting/events/accounting-entity.events';
import { EAccountingEntityActions } from '@domain/accounting/types/accounting-entity-audit.types';
import {
  EAccountingEntityHistoryAction,
  EAccountingEntityType,
  IAccountingEntity,
} from '@domain/accounting/types/accounting-entity.types';

describe('accountingEntityEntity', () => {
  const MOCK_DATE = new Date('2026-04-01T00:00:00.000Z');
  let validPayload: TCreationOmits<IAccountingEntity>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_DATE);

    validPayload = {
      name: 'Test Accounting Entity',
      type: EAccountingEntityType.Individual,
      ownerId: generateUUID(),
      functionalCurrencyCode: 'NGN',
      jurisdictionCode: 'NG',
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('make', () => {
    it('should successfully create an accounting entity with valid payload', () => {
      const [entity, events, audit] = accountingEntityEntity.make(validPayload);

      expect(entity.id).toBeDefined();
      expect(typeof entity.id).toBe('string');
      expect(entity.name).toBe(validPayload.name);
      expect(entity.type).toBe(validPayload.type);
      expect(entity.ownerId).toBe(validPayload.ownerId);
      expect(entity.functionalCurrencyCode).toBe(
        validPayload.functionalCurrencyCode
      );
      expect(entity.jurisdictionCode).toBe(validPayload.jurisdictionCode);
      expect(entity.createdAt).toEqual(MOCK_DATE);
      expect(entity.updatedAt).toEqual(MOCK_DATE);

      expect(Object.isFrozen(entity)).toBe(true);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(EAccountingEntityEvents.Created);
      expect(events[0].data).toEqual(entity);

      expect(audit).toEqual({
        entityId: entity.id,
        entityVersion: 1,
        action: EAccountingEntityActions.Created,
        diff: {
          before: null,
          after: entity,
        },
        occurredAt: entity.updatedAt,
      });
      expect(Object.isFrozen(audit)).toBe(true);
    });

    it('should throw if invalid type is provided', () => {
      const invalidPayload = {
        ...validPayload,
        type: 'invalid-type',
      };

      // @ts-expect-error testing invalid type
      expect(() => accountingEntityEntity.make(invalidPayload)).toThrow();
    });

    it('should throw if invalid ownerId is provided', () => {
      const invalidPayload = {
        ...validPayload,
        ownerId: 'invalid-uuid',
      };

      // @ts-expect-error testing invalid ownerId type
      expect(() => accountingEntityEntity.make(invalidPayload)).toThrow();
    });

    it('should throw if name is too short', () => {
      const invalidPayload = {
        ...validPayload,
        name: '',
      };

      expect(() => accountingEntityEntity.make(invalidPayload)).toThrow();
    });

    it('should throw if name is missing', () => {
      const invalidPayload = {
        ...validPayload,
        name: undefined,
      };

      // @ts-expect-error testing missing property
      expect(() => accountingEntityEntity.make(invalidPayload)).toThrow();
    });
  });

  describe('helpers', () => {
    describe('isValidType', () => {
      it('should return true for valid entity types', () => {
        expect(
          accountingEntityValidation.isValidType(
            EAccountingEntityType.Individual
          )
        ).toBe(true);
        expect(
          accountingEntityValidation.isValidType(
            EAccountingEntityType.SoleTrader
          )
        ).toBe(true);
        expect(
          accountingEntityValidation.isValidType(
            EAccountingEntityType.PrivateCompany
          )
        ).toBe(true);
      });

      it('should return false for invalid entity type', () => {
        // @ts-expect-error testing invalid argument
        expect(accountingEntityValidation.isValidType('invalid-type')).toBe(
          false
        );
      });
    });

    describe('validateType', () => {
      it('should not throw for valid entity type', () => {
        expect(() =>
          accountingEntityValidation.validateType(
            EAccountingEntityType.Individual
          )
        ).not.toThrow();
      });

      it('should throw AppError for invalid entity type', () => {
        expect(() =>
          // @ts-expect-error testing invalid argument
          accountingEntityValidation.validateType('invalid-type')
        ).toThrow();
      });
    });

    describe('isValidJurisdictionCode', () => {
      it('returns true for a valid jurisdiction code', () => {
        expect(accountingEntityValidation.isValidJurisdictionCode('NG')).toBe(
          true
        );
        expect(accountingEntityValidation.isValidJurisdictionCode('US')).toBe(
          true
        );
      });

      it('returns false for an invalid jurisdiction code', () => {
        expect(
          accountingEntityValidation.isValidJurisdictionCode('INVALID')
        ).toBe(false);
        expect(accountingEntityValidation.isValidJurisdictionCode(123)).toBe(
          false
        );
        expect(accountingEntityValidation.isValidJurisdictionCode(null)).toBe(
          false
        );
      });
    });

    describe('validateJurisdictionCode', () => {
      it('does not throw for a valid jurisdiction code', () => {
        expect(() =>
          accountingEntityValidation.validateJurisdictionCode('NG')
        ).not.toThrow();
      });

      it('throws AppError for an invalid jurisdiction code', () => {
        expect(() =>
          accountingEntityValidation.validateJurisdictionCode('INVALID')
        ).toThrow();
      });
    });

    describe('isValidHistoryAction', () => {
      it('should return true for valid history actions', () => {
        expect(
          accountingEntityValidation.isValidHistoryAction(
            EAccountingEntityHistoryAction.Created
          )
        ).toBe(true);
        expect(
          accountingEntityValidation.isValidHistoryAction(
            EAccountingEntityHistoryAction.Updated
          )
        ).toBe(true);
      });

      it('should return false for invalid history action', () => {
        expect(
          // @ts-expect-error testing invalid argument
          accountingEntityValidation.isValidHistoryAction('invalid-action')
        ).toBe(false);
      });
    });

    describe('validateHistoryAction', () => {
      it('should not throw for valid history action', () => {
        expect(() =>
          accountingEntityValidation.validateHistoryAction(
            EAccountingEntityHistoryAction.Created
          )
        ).not.toThrow();
      });

      it('should throw AppError for invalid history action', () => {
        expect(() =>
          // @ts-expect-error testing invalid argument
          accountingEntityValidation.validateHistoryAction('invalid-action')
        ).toThrow();
      });
    });
  });
});
