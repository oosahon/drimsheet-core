import { TEntityId } from '@shared/types/uuid';

import { SYSTEM_JURISDICTIONS } from '@domain/accounting/config/jurisdictions.config';
import periodError from '@domain/accounting/errors/period.error';
import makeAccountingEntityService from '@domain/accounting/services/accounting-entity.service';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '@domain/accounting/types/accounting-entity.types';
import { EPeriodUnit } from '@domain/accounting/types/period.types';

describe('accountingEntityService', () => {
  const service = makeAccountingEntityService();

  describe('create', () => {
    const input = {
      name: 'Test Business',
      type: EAccountingEntityType.Individual,
      ownerId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
      functionalCurrencyCode: 'USD' as const,
      reportingCurrencyCode: 'USD' as const,
      jurisdictionCode: 'US' as const,
      accountingStandardCode: 'US_GAAP' as const,
      fiscalYear: {
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T23:59:59.999Z'),
      },
      accountingPeriod: { unit: EPeriodUnit.Month, count: 1 },
      reportingPeriod: { unit: EPeriodUnit.Quarter, count: 1 },
    };

    it('creates the complete accounting entity graph', () => {
      const result = service.create(input);

      expect(result.accountingEntity[0]).toMatchObject({
        ownerId: input.ownerId,
        jurisdictionCode: input.jurisdictionCode,
      });
      expect(result.fiscalYear[0].accountingEntityId).toBe(
        result.accountingEntity[0].id
      );
      expect(result.accountingPeriods.length).toBeGreaterThan(0);
      expect(result.reportingPeriods.length).toBeGreaterThan(0);
      expect(result.accountingContext[0].fiscalYearId).toBe(
        result.fiscalYear[0].id
      );
      expect(result.reportingContext[0].accountingContextId).toBe(
        result.accountingContext[0].id
      );
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('falls back to the first period when current date is outside the fiscal year', () => {
      const result = service.create({
        ...input,
        fiscalYear: {
          startDate: new Date('2030-01-01T00:00:00.000Z'),
          endDate: new Date('2030-12-31T23:59:59.999Z'),
        },
      });

      expect(result.accountingContext[0].currentAccountingPeriodId).toBe(
        result.accountingPeriods[0][0].id
      );
      expect(result.reportingContext[0].currentReportingPeriodId).toBe(
        result.reportingPeriods[0][0].id
      );
    });

    it('accepts the exact jurisdiction fiscal limit', () => {
      expect(() =>
        service.create({
          ...input,
          fiscalYear: {
            ...input.fiscalYear,
            endDate: new Date('2027-07-01T00:00:00.000Z'),
          },
        })
      ).not.toThrow();
    });

    it('rejects a fiscal year beyond the jurisdiction limit', () => {
      const endDate = new Date('2027-07-01T00:00:00.001Z');

      expect(() =>
        service.create({
          ...input,
          fiscalYear: {
            ...input.fiscalYear,
            endDate,
          },
        })
      ).toThrow(
        new periodError.FiscalYearExceedsJurisdictionLimit({
          jurisdictionCode: 'US',
          maxFiscalMonths: 18,
          startDate: input.fiscalYear.startDate,
          endDate,
          maximumEndDate: new Date('2027-07-01T00:00:00.000Z'),
        })
      );
    });

    it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
      'rejects invalid jurisdiction fiscal policy %s',
      (maxFiscalMonths) => {
        const jurisdiction = SYSTEM_JURISDICTIONS.US;
        const configuredLimit = jurisdiction.maxFiscalMonths;
        jurisdiction.maxFiscalMonths = maxFiscalMonths;

        try {
          expect(() => service.create(input)).toThrow(
            'accounting_error_period_invalid_date_range'
          );
        } finally {
          jurisdiction.maxFiscalMonths = configuredLimit;
        }
      }
    );
  });

  describe('grantUserAccess', () => {
    it('should return true if user is owner', () => {
      const entity = { ownerId: 'user-1' as TEntityId } as IAccountingEntity;
      expect(service.grantUserAccess(entity, 'user-1' as TEntityId)).toBe(true);
    });

    it('should return false if user is not owner', () => {
      const entity = { ownerId: 'user-1' as TEntityId } as IAccountingEntity;
      expect(service.grantUserAccess(entity, 'user-2' as TEntityId)).toBe(
        false
      );
    });
  });

  describe('validateAccess', () => {
    it('should not throw if user is owner', () => {
      const entity = { ownerId: 'user-1' as TEntityId } as IAccountingEntity;
      expect(() =>
        service.validateAccess(entity, 'user-1' as TEntityId)
      ).not.toThrow();
    });

    it('should throw UnauthorizedUserAccess if user is not owner', () => {
      const entity = { ownerId: 'user-1' as TEntityId } as IAccountingEntity;
      expect(() =>
        service.validateAccess(entity, 'user-2' as TEntityId)
      ).toThrow();
    });
  });
});
