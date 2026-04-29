import { AppError } from '../../../../shared/errors/error';
import { TEntityId } from '../../../../shared/types/uuid';
import periodErrors from '../../errors/period.errors';
import {
  EPeriodStatus,
  EPeriodUnit,
  UPeriodUnit,
} from '../../types/period.types';
import periodEntity from '../period.entity';

describe('periodEntity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-01T00:00:00.000Z'));
  });

  const validUUID = '98402eb7-ec79-436f-b258-00a4fb9a572a' as TEntityId;

  describe('validateUnit', () => {
    it('does not throw for a valid unit', () => {
      expect(() => periodEntity.validateUnit(EPeriodUnit.Month)).not.toThrow();
      expect(() =>
        periodEntity.validateUnit(EPeriodUnit.Quarter)
      ).not.toThrow();
    });

    it('throws InvalidPeriodUnitError if unit is invalid', () => {
      expect(() => periodEntity.validateUnit('invalid')).toThrow(
        periodErrors.InvalidUnit
      );
    });
  });

  describe('validateStatus', () => {
    it('does not throw for a valid status', () => {
      expect(() =>
        periodEntity.validateStatus(EPeriodStatus.Open)
      ).not.toThrow();
      expect(() =>
        periodEntity.validateStatus(EPeriodStatus.Pending)
      ).not.toThrow();
    });

    it('throws InvalidPeriodStatusError for an invalid status', () => {
      expect(() => periodEntity.validateStatus('invalid')).toThrow(
        periodErrors.InvalidStatus
      );
    });
  });

  describe('makeReportingPeriod', () => {
    const validPayload = {
      name: 'Q1 2026',
      accountingEntityId: validUUID,
      fiscalYearId: '12302eb7-ec79-436f-b258-00a4fb9a5123' as TEntityId,
      unit: EPeriodUnit.Quarter,
      count: 1,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-03-31T23:59:59.999Z'),
    };

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-04-01T00:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('creates a valid reporting period entity with events', () => {
      const [entity, events] = periodEntity.makeReportingPeriod(validPayload);

      expect(entity.name).toBe(validPayload.name);
      expect(entity.accountingEntityId).toBe(validPayload.accountingEntityId);
      expect(entity.fiscalYearId).toBe(validPayload.fiscalYearId);
      expect(entity.unit).toBe(validPayload.unit);
      expect(entity.count).toBe(validPayload.count);
      expect(entity.startDate).toEqual(validPayload.startDate);
      expect(entity.endDate).toEqual(validPayload.endDate);
      expect(entity.updatedAt).toEqual(new Date('2026-04-01T00:00:00.000Z'));
      expect(entity.id).toBeDefined();

      expect(Object.isFrozen(entity)).toBe(true);

      expect(events.length).toBe(1);
    });

    it('throws AppError if accountingEntityId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        accountingEntityId: 'invalid' as TEntityId,
      };
      expect(() => periodEntity.makeReportingPeriod(invalidPayload)).toThrow(
        AppError
      );
    });

    it('throws AppError if fiscalYearId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        fiscalYearId: 'invalid' as TEntityId,
      };
      expect(() => periodEntity.makeReportingPeriod(invalidPayload)).toThrow(
        AppError
      );
    });

    it('throws InvalidPeriodUnitError if unit is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        unit: 'invalid' as UPeriodUnit,
      };
      expect(() => periodEntity.makeReportingPeriod(invalidPayload)).toThrow(
        periodErrors.InvalidUnit
      );
    });
  });
});
