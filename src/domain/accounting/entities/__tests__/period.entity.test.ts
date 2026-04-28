import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/value-objects/error';
import { EPeriodEvents } from '../../events/period.events';
import { EPeriodStatus, EPeriodUnit } from '../../types/period.types';
import periodEntity from '../period.entity';

describe('periodEntity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('isValidMeasurement', () => {
    it('returns true for a valid unit', () => {
      expect(periodEntity.isValidMeasurement(EPeriodUnit.Month)).toBe(true);
    });

    it('returns false for an invalid unit', () => {
      expect(periodEntity.isValidMeasurement('invalid')).toBe(false);
    });
  });

  describe('validateMeasurement', () => {
    it('does not throw for a valid unit', () => {
      expect(() =>
        periodEntity.validateMeasurement(EPeriodUnit.Month)
      ).not.toThrow();
    });

    it('throws AppError for an invalid unit', () => {
      expect(() => periodEntity.validateMeasurement('invalid')).toThrow(
        AppError
      );
    });
  });

  describe('isValidStatus', () => {
    it('returns true for a valid status', () => {
      expect(periodEntity.isValidStatus(EPeriodStatus.Pending)).toBe(true);
    });

    it('returns false for an invalid status', () => {
      expect(periodEntity.isValidStatus('invalid')).toBe(false);
    });
  });

  describe('validateStatus', () => {
    it('does not throw for a valid status', () => {
      expect(() =>
        periodEntity.validateStatus(EPeriodStatus.Pending)
      ).not.toThrow();
    });

    it('throws AppError for an invalid status', () => {
      expect(() => periodEntity.validateStatus('invalid')).toThrow(AppError);
    });
  });

  describe('makeFiscalYear', () => {
    const validPayload = {
      name: 'FY 2026',
      accountingEntityId: '98402eb7-ec79-436f-b258-00a4fb9a572a' as TEntityId,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.999Z'),
      status: EPeriodStatus.Pending,
    };

    it('creates a valid fiscal year entity with events', () => {
      const [entity, events] = periodEntity.makeFiscalYear(validPayload);

      expect(entity.name).toBe(validPayload.name);
      expect(entity.accountingEntityId).toBe(validPayload.accountingEntityId);
      expect(entity.startDate).toBe(validPayload.startDate);
      expect(entity.endDate).toBe(validPayload.endDate);
      expect(entity.status).toBe(validPayload.status);
      expect(entity.unit).toBe(EPeriodUnit.Month);
      expect(entity.count).toBe(12);
      expect(entity.closedAt).toBeNull();
      expect(entity.updatedAt).toEqual(new Date('2026-04-01T00:00:00.000Z'));
      expect(entity.id).toBeDefined();

      expect(Object.isFrozen(entity)).toBe(true);

      expect(events.length).toBe(1);
      expect(events[0].type).toBe(EPeriodEvents.FiscalYearCreated);
      expect(events[0].data).toBe(entity);
    });

    it('throws AppError if name is invalid', () => {
      const invalidPayload = { ...validPayload, name: '' };
      expect(() => periodEntity.makeFiscalYear(invalidPayload)).toThrow(
        AppError
      );
    });

    it('throws AppError if accountingEntityId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        accountingEntityId: 'invalid' as TEntityId,
      };
      expect(() => periodEntity.makeFiscalYear(invalidPayload)).toThrow(
        AppError
      );
    });

    it('throws AppError if startDate is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        startDate: 'invalid',
      };
      // @ts-expect-error testing invalid start date
      expect(() => periodEntity.makeFiscalYear(invalidPayload)).toThrow(
        AppError
      );
    });

    it('throws AppError if endDate is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        endDate: 'invalid',
      };
      // @ts-expect-error testing invalid end date
      expect(() => periodEntity.makeFiscalYear(invalidPayload)).toThrow(
        AppError
      );
    });

    it('throws AppError if startDate is after endDate', () => {
      const invalidPayload = {
        ...validPayload,
        startDate: new Date('2026-12-31T23:59:59.999Z'),
        endDate: new Date('2026-01-01T00:00:00.000Z'),
      };
      expect(() => periodEntity.makeFiscalYear(invalidPayload)).toThrow(
        AppError
      );
    });

    it('throws AppError if status is invalid', () => {
      const invalidPayload = { ...validPayload, status: 'invalid' };
      // @ts-expect-error testing invalid status
      expect(() => periodEntity.makeFiscalYear(invalidPayload)).toThrow(
        AppError
      );
    });
  });

  describe('makeAccountingPeriod', () => {
    const validPayload = {
      name: 'Q1 2026',
      accountingEntityId: '98402eb7-ec79-436f-b258-00a4fb9a572a' as TEntityId,
      fiscalYearId: '12302eb7-ec79-436f-b258-00a4fb9a5123' as TEntityId,
      unit: EPeriodUnit.Quarter,
      count: 1,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-03-31T23:59:59.999Z'),
      status: EPeriodStatus.Pending,
    };

    it('creates a valid accounting period entity with events', () => {
      const [entity, events] = periodEntity.makeAccountingPeriod(validPayload);

      expect(entity.name).toBe(validPayload.name);
      expect(entity.accountingEntityId).toBe(validPayload.accountingEntityId);
      expect(entity.fiscalYearId).toBe(validPayload.fiscalYearId);
      expect(entity.unit).toBe(validPayload.unit);
      expect(entity.count).toBe(validPayload.count);
      expect(entity.startDate).toBe(validPayload.startDate);
      expect(entity.endDate).toBe(validPayload.endDate);
      expect(entity.status).toBe(validPayload.status);
      expect(entity.closedAt).toBeNull();
      expect(entity.updatedAt).toEqual(new Date('2026-04-01T00:00:00.000Z'));
      expect(entity.id).toBeDefined();

      expect(Object.isFrozen(entity)).toBe(true);

      expect(events.length).toBe(1);
      expect(events[0].type).toBe(EPeriodEvents.AccountingPeriodCreated);
      expect(events[0].data).toBe(entity);
    });

    it('throws AppError if unit is invalid', () => {
      const invalidPayload = { ...validPayload, unit: 'invalid' };
      // @ts-expect-error testing invalid unit
      expect(() => periodEntity.makeAccountingPeriod(invalidPayload)).toThrow(
        AppError
      );
    });

    it('throws AppError if count is invalid', () => {
      const invalidPayload = { ...validPayload, count: -1 };
      expect(() => periodEntity.makeAccountingPeriod(invalidPayload)).toThrow(
        AppError
      );
    });

    it('throws AppError if count is not a numeric value', () => {
      const invalidPayload = {
        ...validPayload,
        count: 'invalid',
      };
      // @ts-expect-error testing invalid count
      expect(() => periodEntity.makeAccountingPeriod(invalidPayload)).toThrow(
        AppError
      );
    });

    it('throws AppError if fiscalYearId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        fiscalYearId: 'invalid' as TEntityId,
      };
      expect(() => periodEntity.makeAccountingPeriod(invalidPayload)).toThrow(
        AppError
      );
    });
  });

  describe('makeReportingPeriod', () => {
    const validPayload = {
      name: 'January 2026',
      accountingEntityId: '98402eb7-ec79-436f-b258-00a4fb9a572a' as TEntityId,
      fiscalYearId: '12302eb7-ec79-436f-b258-00a4fb9a5123' as TEntityId,
      unit: EPeriodUnit.Month,
      count: 1,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-01-31T23:59:59.999Z'),
    };

    it('creates a valid reporting period entity with events', () => {
      const [entity, events] = periodEntity.makeReportingPeriod(validPayload);

      expect(entity.name).toBe(validPayload.name);
      expect(entity.accountingEntityId).toBe(validPayload.accountingEntityId);
      expect(entity.fiscalYearId).toBe(validPayload.fiscalYearId);
      expect(entity.unit).toBe(validPayload.unit);
      expect(entity.count).toBe(validPayload.count);
      expect(entity.startDate).toBe(validPayload.startDate);
      expect(entity.endDate).toBe(validPayload.endDate);
      expect(entity.updatedAt).toEqual(new Date('2026-04-01T00:00:00.000Z'));
      expect(entity.id).toBeDefined();

      expect(Object.isFrozen(entity)).toBe(true);

      expect(events.length).toBe(1);
      expect(events[0].type).toBe(EPeriodEvents.ReportingPeriodCreated);
      expect(events[0].data).toBe(entity);
    });

    it('throws AppError if unit is invalid', () => {
      const invalidPayload = { ...validPayload, unit: 'invalid' };
      // @ts-expect-error testing invalid unit
      expect(() => periodEntity.makeReportingPeriod(invalidPayload)).toThrow(
        AppError
      );
    });

    it('throws AppError if count is invalid', () => {
      const invalidPayload = { ...validPayload, count: -1 };
      expect(() => periodEntity.makeReportingPeriod(invalidPayload)).toThrow(
        AppError
      );
    });
  });
});
