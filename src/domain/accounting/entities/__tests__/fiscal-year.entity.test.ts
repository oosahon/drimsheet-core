import { AppError } from '../../../../shared/errors/error';
import { TEntityId } from '../../../../shared/types/uuid';
import periodErrors from '../../errors/period.errors';
import { EPeriodEvents } from '../../events/period.events';
import { EPeriodStatus } from '../../types/period.types';
import fiscalYearEntity from '../fiscal-year.entity';

describe('fiscalYearEntity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('make', () => {
    const validPayload = {
      name: 'FY 2026',
      accountingEntityId: '98402eb7-ec79-436f-b258-00a4fb9a572a' as TEntityId,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.999Z'),
      status: EPeriodStatus.Pending,
    };

    it('creates a valid fiscal year entity with events', () => {
      const [entity, events] = fiscalYearEntity.make(validPayload);

      expect(entity.name).toBe(validPayload.name);
      expect(entity.accountingEntityId).toBe(validPayload.accountingEntityId);
      expect(entity.startDate).toBe(validPayload.startDate);
      expect(entity.endDate).toBe(validPayload.endDate);
      expect(entity.status).toBe(validPayload.status);
      expect(entity.closedAt).toBeNull();
      expect(entity.updatedAt).toEqual(new Date('2026-04-01T00:00:00.000Z'));
      expect(entity.id).toBeDefined();

      expect(Object.isFrozen(entity)).toBe(true);

      expect(events.length).toBe(1);
      expect(events[0].type).toBe(EPeriodEvents.FiscalYearCreated);
      expect(events[0].data).toBe(entity);
    });

    it('derives name if name is not provided', () => {
      const payloadWithoutName = { ...validPayload, name: undefined };
      const [entity] = fiscalYearEntity.make(payloadWithoutName);
      // Depending on fiscalYearHelpers.deriveName implementation, it sets a derived name
      expect(entity.name).toBeDefined();
      expect(typeof entity.name).toBe('string');
    });

    it('throws AppError if accountingEntityId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        accountingEntityId: 'invalid' as TEntityId,
      };
      expect(() => fiscalYearEntity.make(invalidPayload)).toThrow(AppError);
    });

    it('throws InvalidPeriodDateRangeError if startDate is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        startDate: 'invalid',
      };
      // @ts-expect-error testing invalid start date
      expect(() => fiscalYearEntity.make(invalidPayload)).toThrow(
        periodErrors.InvalidDateRange
      );
    });

    it('throws InvalidPeriodDateRangeError if endDate is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        endDate: 'invalid',
      };
      // @ts-expect-error testing invalid end date
      expect(() => fiscalYearEntity.make(invalidPayload)).toThrow(
        periodErrors.InvalidDateRange
      );
    });

    it('throws InvalidPeriodDateRangeError if startDate is after endDate', () => {
      const invalidPayload = {
        ...validPayload,
        startDate: new Date('2026-12-31T23:59:59.999Z'),
        endDate: new Date('2026-01-01T00:00:00.000Z'),
      };
      expect(() => fiscalYearEntity.make(invalidPayload)).toThrow(
        periodErrors.InvalidDateRange
      );
    });

    it('throws InvalidPeriodStatusError if status is invalid', () => {
      const invalidPayload = { ...validPayload, status: 'invalid' };
      // @ts-expect-error testing invalid status
      expect(() => fiscalYearEntity.make(invalidPayload)).toThrow(
        periodErrors.InvalidStatus
      );
    });
  });

  describe('helpers', () => {
    describe('validateStartAndEndDate', () => {
      it('throws InvalidDateRange if duration is less than 1 month', () => {
        expect(() =>
          fiscalYearEntity.validateStartAndEndDate({
            startDate: new Date('2026-05-01T00:00:00.000Z'),
            endDate: new Date('2026-05-15T00:00:00.000Z'),
          })
        ).toThrow(periodErrors.InvalidDateRange);
      });

      it('throws InvalidDateRange if duration is greater than 23 months', () => {
        expect(() =>
          fiscalYearEntity.validateStartAndEndDate({
            startDate: new Date('2026-05-01T00:00:00.000Z'),
            endDate: new Date('2028-06-01T00:00:00.000Z'),
          })
        ).toThrow(periodErrors.InvalidDateRange);
      });
    });

    describe('deriveName', () => {
      it('returns the provided name sanitized and validated', () => {
        const name = fiscalYearEntity.deriveName(
          new Date('2026-01-01T00:00:00.000Z'),
          new Date('2026-12-31T23:59:59.999Z'),
          '  Custom FY 2026  '
        );
        expect(name).toBe('Custom FY 2026');
      });

      it('validates dates by default when name is not provided', () => {
        expect(() =>
          fiscalYearEntity.deriveName(
            new Date('2026-05-01T00:00:00.000Z'),
            new Date('2026-05-15T00:00:00.000Z'),
            null
          )
        ).toThrow(periodErrors.InvalidDateRange);
      });

      it('returns single year string when start and end years are the same', () => {
        const name = fiscalYearEntity.deriveName(
          new Date('2026-05-01T00:00:00.000Z'),
          new Date('2026-11-01T00:00:00.000Z'),
          null,
          false
        );
        expect(name).toBe('2026');
      });

      it('returns start and end year string when start and end years differ', () => {
        const name = fiscalYearEntity.deriveName(
          new Date('2026-01-01T00:00:00.000Z'),
          new Date('2027-03-31T23:59:59.999Z'),
          null,
          false
        );
        expect(name).toBe('2026 - 2027');
      });
    });
  });
});
