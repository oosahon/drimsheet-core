import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import { EAccountingEntityEvents } from '../../events/accounting-entity.events';
import {
  EAccountingEntityHistoryAction,
  EAccountingEntityType,
  IAccountingEntity,
} from '../../types/accounting-entity.types';
import accountingEntityEntity from '../accounting-entity.entity';

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
      const [entity, events] = accountingEntityEntity.make(validPayload);

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
          accountingEntityEntity.isValidType(EAccountingEntityType.Individual)
        ).toBe(true);
        expect(
          accountingEntityEntity.isValidType(EAccountingEntityType.SoleTrader)
        ).toBe(true);
        expect(
          accountingEntityEntity.isValidType(
            EAccountingEntityType.PrivateCompany
          )
        ).toBe(true);
      });

      it('should return false for invalid entity type', () => {
        // @ts-expect-error testing invalid argument
        expect(accountingEntityEntity.isValidType('invalid-type')).toBe(false);
      });
    });

    describe('validateType', () => {
      it('should not throw for valid entity type', () => {
        expect(() =>
          accountingEntityEntity.validateType(EAccountingEntityType.Individual)
        ).not.toThrow();
      });

      it('should throw AppError for invalid entity type', () => {
        expect(() =>
          // @ts-expect-error testing invalid argument
          accountingEntityEntity.validateType('invalid-type')
        ).toThrow();
      });
    });

    describe('isValidJurisdictionCode', () => {
      it('returns true for a valid jurisdiction code', () => {
        expect(accountingEntityEntity.isValidJurisdictionCode('NG')).toBe(true);
        expect(accountingEntityEntity.isValidJurisdictionCode('US')).toBe(true);
      });

      it('returns false for an invalid jurisdiction code', () => {
        expect(accountingEntityEntity.isValidJurisdictionCode('INVALID')).toBe(
          false
        );
        expect(accountingEntityEntity.isValidJurisdictionCode(123)).toBe(false);
        expect(accountingEntityEntity.isValidJurisdictionCode(null)).toBe(
          false
        );
      });
    });

    describe('validateJurisdictionCode', () => {
      it('does not throw for a valid jurisdiction code', () => {
        expect(() =>
          accountingEntityEntity.validateJurisdictionCode('NG')
        ).not.toThrow();
      });

      it('throws AppError for an invalid jurisdiction code', () => {
        expect(() =>
          accountingEntityEntity.validateJurisdictionCode('INVALID')
        ).toThrow();
      });
    });

    describe('isValidHistoryAction', () => {
      it('should return true for valid history actions', () => {
        expect(
          accountingEntityEntity.isValidHistoryAction(
            EAccountingEntityHistoryAction.Created
          )
        ).toBe(true);
        expect(
          accountingEntityEntity.isValidHistoryAction(
            EAccountingEntityHistoryAction.Updated
          )
        ).toBe(true);
      });

      it('should return false for invalid history action', () => {
        expect(
          // @ts-expect-error testing invalid argument
          accountingEntityEntity.isValidHistoryAction('invalid-action')
        ).toBe(false);
      });
    });

    describe('validateHistoryAction', () => {
      it('should not throw for valid history action', () => {
        expect(() =>
          accountingEntityEntity.validateHistoryAction(
            EAccountingEntityHistoryAction.Created
          )
        ).not.toThrow();
      });

      it('should throw AppError for invalid history action', () => {
        expect(() =>
          // @ts-expect-error testing invalid argument
          accountingEntityEntity.validateHistoryAction('invalid-action')
        ).toThrow();
      });
    });
  });
});
