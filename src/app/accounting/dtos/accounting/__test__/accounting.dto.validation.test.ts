import { EAccountingEntityType } from '../../../../../domain/accounting/types/accounting-entity.types';
import { EPeriodUnit } from '../../../../../domain/accounting/types/period.types';
import { EAppUsageModePreference } from '../../../../../domain/user/types/user-preferences.types';
import {
  accountingEntityOnboardingDtoSchema,
  accountingEntityTypeValidation,
  accountingStandardCodeValidation,
  fiscalYearCreationDtoSchema,
  jurisdictionCodeValidation,
  periodCreationDtoSchema,
  periodDayValidation,
  periodMonthValidation,
  periodUnitValidation,
} from '../accounting.dto.validation';

describe('Accounting DTO Validation', () => {
  describe('jurisdictionCodeValidation', () => {
    it('should validate a correct jurisdiction code', () => {
      expect(jurisdictionCodeValidation.safeParse('GB').success).toBe(true);
    });

    it('should fail on unsupported jurisdiction code', () => {
      expect(jurisdictionCodeValidation.safeParse('ZZ').success).toBe(false);
    });
  });

  describe('accountingEntityTypeValidation', () => {
    it('should validate all valid accounting entity types', () => {
      expect(
        accountingEntityTypeValidation.safeParse(
          EAccountingEntityType.Individual
        ).success
      ).toBe(true);
      expect(
        accountingEntityTypeValidation.safeParse(
          EAccountingEntityType.SoleTrader
        ).success
      ).toBe(true);
      expect(
        accountingEntityTypeValidation.safeParse(
          EAccountingEntityType.PrivateCompany
        ).success
      ).toBe(true);
    });

    it('should fail on invalid accounting entity type', () => {
      expect(
        accountingEntityTypeValidation.safeParse('InvalidType').success
      ).toBe(false);
    });
  });

  describe('accountingStandardCodeValidation', () => {
    it('should validate a correct accounting standard code', () => {
      expect(
        accountingStandardCodeValidation.safeParse('UK_GAAP').success
      ).toBe(true);
    });

    it('should fail on unsupported accounting standard code', () => {
      expect(
        accountingStandardCodeValidation.safeParse('INVALID_STANDARD').success
      ).toBe(false);
    });
  });

  describe('periodDayValidation', () => {
    it('should validate correct days', () => {
      expect(periodDayValidation.safeParse(1).success).toBe(true);
      expect(periodDayValidation.safeParse(15).success).toBe(true);
      expect(periodDayValidation.safeParse(31).success).toBe(true);
    });

    it('should fail on invalid days', () => {
      expect(periodDayValidation.safeParse(0).success).toBe(false);
      expect(periodDayValidation.safeParse(32).success).toBe(false);
      expect(periodDayValidation.safeParse(-5).success).toBe(false);
    });
  });

  describe('periodMonthValidation', () => {
    it('should validate correct months', () => {
      expect(periodMonthValidation.safeParse(1).success).toBe(true);
      expect(periodMonthValidation.safeParse(6).success).toBe(true);
      expect(periodMonthValidation.safeParse(12).success).toBe(true);
    });

    it('should fail on invalid months', () => {
      expect(periodMonthValidation.safeParse(0).success).toBe(false);
      expect(periodMonthValidation.safeParse(13).success).toBe(false);
      expect(periodMonthValidation.safeParse(-1).success).toBe(false);
    });
  });

  describe('periodUnitValidation', () => {
    it('should validate correct period units', () => {
      expect(periodUnitValidation.safeParse(EPeriodUnit.Day).success).toBe(
        true
      );
      expect(periodUnitValidation.safeParse(EPeriodUnit.Month).success).toBe(
        true
      );
      expect(periodUnitValidation.safeParse(EPeriodUnit.Year).success).toBe(
        true
      );
    });

    it('should fail on invalid period units', () => {
      expect(periodUnitValidation.safeParse('InvalidUnit').success).toBe(false);
    });
  });

  describe('fiscalYearCreationDtoSchema', () => {
    it('should validate correct fiscal year dates', () => {
      const payload = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      };
      expect(fiscalYearCreationDtoSchema.safeParse(payload).success).toBe(true);
    });

    it('should fail if dates are missing or invalid types', () => {
      expect(
        fiscalYearCreationDtoSchema.safeParse({ startDate: '2026-01-01' })
          .success
      ).toBe(false);
    });

    it.each([
      ['equal dates', '2026-01-01', '2026-01-01'],
      ['reversed dates', '2026-02-01', '2026-01-01'],
      ['more than 18 months', '2026-01-01', '2027-07-02'],
    ])('should reject %s', (_label, startDate, endDate) => {
      expect(
        fiscalYearCreationDtoSchema.safeParse({
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        }).success
      ).toBe(false);
    });

    it('should accept an 18-month fiscal year boundary', () => {
      expect(
        fiscalYearCreationDtoSchema.safeParse({
          startDate: new Date('2026-01-01'),
          endDate: new Date('2027-07-01'),
        }).success
      ).toBe(true);
    });

    it('should enforce the 18-month boundary from a month-end start date', () => {
      expect(
        fiscalYearCreationDtoSchema.safeParse({
          startDate: new Date('2026-08-31'),
          endDate: new Date('2028-03-01'),
        }).success
      ).toBe(false);
      expect(
        fiscalYearCreationDtoSchema.safeParse({
          startDate: new Date('2026-08-31'),
          endDate: new Date('2028-02-29'),
        }).success
      ).toBe(true);
    });
  });

  describe('periodCreationDtoSchema', () => {
    it('should validate correct period details', () => {
      const payload = {
        unit: EPeriodUnit.Month,
        count: 12,
      };
      expect(periodCreationDtoSchema.safeParse(payload).success).toBe(true);
    });

    it('should fail if count is invalid', () => {
      const payload = {
        unit: EPeriodUnit.Month,
        count: 'twelve',
      };
      expect(periodCreationDtoSchema.safeParse(payload).success).toBe(false);
    });

    it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 551])(
      'should reject unsafe count %s',
      (count) => {
        expect(
          periodCreationDtoSchema.safeParse({
            unit: EPeriodUnit.Day,
            count,
          }).success
        ).toBe(false);
      }
    );

    it.each([1, 550])('should accept boundary count %s', (count) => {
      expect(
        periodCreationDtoSchema.safeParse({
          unit: EPeriodUnit.Day,
          count,
        }).success
      ).toBe(true);
    });
  });

  describe('accountingEntityOnboardingDtoSchema', () => {
    it('should validate a correct onboarding payload', () => {
      const payload = {
        name: 'Test Company',
        entityType: EAccountingEntityType.PrivateCompany,
        jurisdictionCode: 'GB',
        accountingStandardCode: 'UK_GAAP',
        functionalCurrencyCode: 'GBP',
        reportingCurrencyCode: 'GBP',
        fiscalYear: {
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
        },
        accountingPeriod: {
          unit: EPeriodUnit.Month,
          count: 1,
        },
        reportingPeriod: {
          unit: EPeriodUnit.Month,
          count: 3,
        },
        appUsageMode: EAppUsageModePreference.PowerUser,
      };
      expect(
        accountingEntityOnboardingDtoSchema.safeParse(payload).success
      ).toBe(true);
    });

    it('should fail if onboarding payload is invalid', () => {
      const payload = {
        name: 'Test Company',
        entityType: 'InvalidType',
      };
      expect(
        accountingEntityOnboardingDtoSchema.safeParse(payload).success
      ).toBe(false);
    });
  });
});
