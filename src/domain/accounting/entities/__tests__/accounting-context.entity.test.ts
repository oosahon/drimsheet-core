import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/value-objects/error';
import { EAccountingContextEvents } from '../../events/accounting-context.events';
import accountingContextEntity from '../accounting-context.entity';

describe('accountingContextEntity', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const validPayload = {
    accountEntityId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
    functionalCurrencyCode: 'NGN',
    jurisdictionCode: 'NG',
    accountingStandardCode: 'IFRS',
    fiscalYearId: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    currentAccountingPeriodId:
      '123e4567-e89b-12d3-a456-426614174002' as TEntityId,
  } as const;

  describe('isValidJurisdictionCode', () => {
    it('returns true for a valid jurisdiction code', () => {
      expect(accountingContextEntity.isValidJurisdictionCode('NG')).toBe(true);
      expect(accountingContextEntity.isValidJurisdictionCode('US')).toBe(true);
    });

    it('returns false for an invalid jurisdiction code', () => {
      expect(accountingContextEntity.isValidJurisdictionCode('INVALID')).toBe(
        false
      );
      expect(accountingContextEntity.isValidJurisdictionCode(123)).toBe(false);
      expect(accountingContextEntity.isValidJurisdictionCode(null)).toBe(false);
    });
  });

  describe('validateJurisdictionCode', () => {
    it('does not throw for a valid jurisdiction code', () => {
      expect(() =>
        accountingContextEntity.validateJurisdictionCode('NG')
      ).not.toThrow();
    });

    it('throws AppError for an invalid jurisdiction code', () => {
      expect(() =>
        accountingContextEntity.validateJurisdictionCode('INVALID')
      ).toThrow(AppError);
    });
  });

  describe('isValidAccountingStandardCode', () => {
    it('returns true for a valid accounting standard code', () => {
      expect(
        accountingContextEntity.isValidAccountingStandardCode('IFRS')
      ).toBe(true);
      expect(
        accountingContextEntity.isValidAccountingStandardCode('US_GAAP')
      ).toBe(true);
    });

    it('returns false for an invalid accounting standard code', () => {
      expect(
        accountingContextEntity.isValidAccountingStandardCode('INVALID')
      ).toBe(false);
      expect(accountingContextEntity.isValidAccountingStandardCode(123)).toBe(
        false
      );
      expect(accountingContextEntity.isValidAccountingStandardCode(null)).toBe(
        false
      );
    });
  });

  describe('validateAccountingStandardCode', () => {
    it('does not throw for a valid accounting standard code', () => {
      expect(() =>
        accountingContextEntity.validateAccountingStandardCode('IFRS')
      ).not.toThrow();
    });

    it('throws AppError for an invalid accounting standard code', () => {
      expect(() =>
        accountingContextEntity.validateAccountingStandardCode('INVALID')
      ).toThrow(AppError);
    });
  });

  describe('make', () => {
    it('creates a valid accounting context entity with events', () => {
      const [entity, events] = accountingContextEntity.make(validPayload);

      expect(entity).toEqual({
        id: expect.any(String),
        accountEntityId: validPayload.accountEntityId,
        functionalCurrencyCode: validPayload.functionalCurrencyCode,
        jurisdictionCode: validPayload.jurisdictionCode,
        accountingStandardCode: validPayload.accountingStandardCode,
        fiscalYearId: validPayload.fiscalYearId,
        currentAccountingPeriodId: validPayload.currentAccountingPeriodId,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        closedAt: null,
      });
      expect(Object.isFrozen(entity)).toBe(true);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: EAccountingContextEvents.Created,
        data: entity,
      });
    });

    it('throws AppError if accountEntityId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        accountEntityId: 'invalid-uuid',
      };
      // @ts-expect-error testing invalid UUID
      expect(() => accountingContextEntity.make(invalidPayload)).toThrow(
        AppError
      );
    });

    it('throws AppError if functionalCurrencyCode is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        functionalCurrencyCode: 'INVALID',
      };
      // @ts-expect-error testing invalid functionalCurrencyCode
      expect(() => accountingContextEntity.make(invalidPayload)).toThrow(
        AppError
      );
    });

    it('throws AppError if jurisdictionCode is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        jurisdictionCode: 'INVALID',
      };
      // @ts-expect-error testing invalid jurisdictionCode
      expect(() => accountingContextEntity.make(invalidPayload)).toThrow(
        AppError
      );
    });

    it('throws AppError if accountingStandardCode is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        accountingStandardCode: 'INVALID',
      };
      // @ts-expect-error testing invalid accountingStandardCode
      expect(() => accountingContextEntity.make(invalidPayload)).toThrow(
        AppError
      );
    });

    it('throws AppError if fiscalYearId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        fiscalYearId: 'invalid-uuid',
      };
      // @ts-expect-error testing invalid UUID
      expect(() => accountingContextEntity.make(invalidPayload)).toThrow(
        AppError
      );
    });

    it('throws AppError if currentAccountingPeriodId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        currentAccountingPeriodId: 'invalid-uuid',
      };
      // @ts-expect-error testing invalid UUID
      expect(() => accountingContextEntity.make(invalidPayload)).toThrow(
        AppError
      );
    });
  });
});
