import { AppError } from '../../../../shared/errors/error';
import { TEntityId } from '../../../../shared/types/uuid';
import accountingStandardError from '../../errors/accounting-standard.error';
import jurisdictionError from '../../errors/jurisdiction.errors';
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
    name: 'Primary Ledger',
    description: 'The primary US GAAP ledger',
    accountingEntityId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
    accountingStandardCode: 'IFRS',
    fiscalYearId: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    currentAccountingPeriodId:
      '123e4567-e89b-12d3-a456-426614174002' as TEntityId,
  } as const;

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

  describe('getJurisdiction', () => {
    it('returns jurisdiction for a valid code', () => {
      const jurisdiction = accountingContextEntity.getJurisdiction('US');
      expect(jurisdiction.code).toBe('US');
    });

    it('throws InvalidJurisdiction if code is empty', () => {
      expect(() => accountingContextEntity.getJurisdiction('')).toThrow(
        jurisdictionError.InvalidJurisdiction
      );
    });

    it('throws InvalidJurisdiction if code is invalid', () => {
      expect(() =>
        accountingContextEntity.getJurisdiction('INVALID_CODE')
      ).toThrow(jurisdictionError.InvalidJurisdiction);
    });
  });

  describe('validateStandardCode', () => {
    it('does not throw for a valid standard code', () => {
      expect(() =>
        accountingContextEntity.validateStandardCode('US_GAAP')
      ).not.toThrow();
    });

    it('throws InvalidStandard if code is empty', () => {
      // @ts-expect-error testing invalid standard code
      expect(() => accountingContextEntity.validateStandardCode('')).toThrow(
        accountingStandardError.InvalidStandard
      );
    });

    it('throws InvalidStandard if code is invalid', () => {
      // @ts-expect-error testing invalid standard code
      expect(() =>
        accountingContextEntity.validateStandardCode('INVALID_CODE')
      ).toThrow(accountingStandardError.InvalidStandard);
    });
  });

  describe('validateStandardCodeAndJurisdiction', () => {
    it('does not throw for valid standard, jurisdiction, and entity type combination', () => {
      expect(() =>
        accountingContextEntity.validateStandardCodeAndJurisdiction(
          'US_GAAP',
          'US',
          'individual'
        )
      ).not.toThrow();
    });

    it('throws InvalidStandard if entity type has no standard in the jurisdiction', () => {
      // Assuming 'Personal' might not support 'US_GAAP' or we can mock/pass an unsupported combination.
      // E.g. what if we pass 'IFRS' to 'US' if not allowed? Let's test an invalid standard for a valid jurisdiction
      expect(() =>
        accountingContextEntity.validateStandardCodeAndJurisdiction(
          'IFRS',
          'US',
          'individual'
        )
      ).toThrow(accountingStandardError.InvalidStandard);
    });
  });

  describe('make', () => {
    it('creates a valid accounting context entity with events', () => {
      const [entity, events] = accountingContextEntity.make(validPayload);

      expect(entity).toEqual({
        id: expect.any(String),
        name: validPayload.name,
        description: validPayload.description,
        accountingEntityId: validPayload.accountingEntityId,
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

    it('throws AppError if accountingEntityId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        accountingEntityId: 'invalid-uuid',
      };
      // @ts-expect-error testing invalid UUID
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

    it('throws AppError if name is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        name: '',
      };
      expect(() => accountingContextEntity.make(invalidPayload)).toThrow(
        AppError
      );
    });

    it('throws AppError if description is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        description: '',
      };
      expect(() => accountingContextEntity.make(invalidPayload)).toThrow(
        AppError
      );
    });

    it('creates a valid accounting context entity with a null description', () => {
      const validPayloadWithNullDescription = {
        ...validPayload,
        description: null,
      };
      const [entity] = accountingContextEntity.make(
        validPayloadWithNullDescription
      );

      expect(entity.description).toBeNull();
    });
  });
});
