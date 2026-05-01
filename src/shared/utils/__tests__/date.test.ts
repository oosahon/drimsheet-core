import dayjs from 'dayjs';
import dateError from '../../errors/date.errors';
import dateUtils from '../date';

describe('dateUtils', () => {
  describe('isValidDate', () => {
    it('returns true for a valid Date object', () => {
      expect(dateUtils.isValidDate(new Date())).toBe(true);
    });

    it('returns true for a valid date string', () => {
      expect(dateUtils.isValidDate('2026-03-14')).toBe(true);
      expect(dateUtils.isValidDate('2026-03-14T10:00:00Z')).toBe(true);
    });

    it('returns true for a valid timestamp', () => {
      expect(dateUtils.isValidDate(1678788000000)).toBe(true);
    });

    it('returns false for an invalid date string', () => {
      expect(dateUtils.isValidDate('invalid-date')).toBe(false);
    });

    it('returns false for NaN', () => {
      expect(dateUtils.isValidDate(NaN)).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('does not throw for a valid date', () => {
      expect(() => dateUtils.validateDate('2026-03-14')).not.toThrow();
    });

    it('throws dateError.Invalid for an invalid date', () => {
      expect(() => dateUtils.validateDate('invalid-date')).toThrow(
        dateError.Invalid
      );
    });
  });

  describe('isNotInThePast', () => {
    it('returns true for a future date', () => {
      const futureDate = dayjs().add(1, 'day').toDate();
      expect(dateUtils.isNotInThePast(futureDate)).toBe(true);
    });

    it('returns false for a past date', () => {
      const pastDate = dayjs().subtract(1, 'day').toDate();
      expect(dateUtils.isNotInThePast(pastDate)).toBe(false);
    });
  });

  describe('validateDateIsNotInThePast', () => {
    it('does not throw for a future date', () => {
      const futureDate = dayjs().add(1, 'day').toDate();
      expect(() =>
        dateUtils.validateDateIsNotInThePast(futureDate)
      ).not.toThrow();
    });

    it('throws dateError.Past for a past date', () => {
      const pastDate = dayjs().subtract(1, 'day').toDate();
      expect(() => dateUtils.validateDateIsNotInThePast(pastDate)).toThrow(
        dateError.Past
      );
    });
  });

  describe('isNotInTheFuture', () => {
    it('returns true for a past date', () => {
      const pastDate = dayjs().subtract(1, 'day').toDate();
      expect(dateUtils.isNotInTheFuture(pastDate)).toBe(true);
    });

    it('returns false for a future date', () => {
      const futureDate = dayjs().add(1, 'day').toDate();
      expect(dateUtils.isNotInTheFuture(futureDate)).toBe(false);
    });
  });

  describe('validateDateIsNotInTheFuture', () => {
    it('does not throw for a past date', () => {
      const pastDate = dayjs().subtract(1, 'day').toDate();
      expect(() =>
        dateUtils.validateDateIsNotInTheFuture(pastDate)
      ).not.toThrow();
    });

    it('throws dateError.Future for a future date', () => {
      const futureDate = dayjs().add(1, 'day').toDate();
      expect(() => dateUtils.validateDateIsNotInTheFuture(futureDate)).toThrow(
        dateError.Future
      );
    });
  });

  describe('isInTheFuture', () => {
    it('returns true for a future date', () => {
      const futureDate = dayjs().add(1, 'day').toDate();
      expect(dateUtils.isInTheFuture(futureDate)).toBe(true);
    });

    it('returns false for a past date', () => {
      const pastDate = dayjs().subtract(1, 'day').toDate();
      expect(dateUtils.isInTheFuture(pastDate)).toBe(false);
    });

    it('returns false for an invalid date', () => {
      expect(dateUtils.isInTheFuture('invalid-date')).toBe(false);
    });
  });

  describe('validateIsInTheFuture', () => {
    it('does not throw for a future date', () => {
      const futureDate = dayjs().add(1, 'day').toDate();
      expect(() => dateUtils.validateIsInTheFuture(futureDate)).not.toThrow();
    });

    it('throws dateError.PastOrPresent for a past date', () => {
      const pastDate = dayjs().subtract(1, 'day').toDate();
      expect(() => dateUtils.validateIsInTheFuture(pastDate)).toThrow(
        dateError.PastOrPresent
      );
    });

    it('throws dateError.Invalid for an invalid date', () => {
      expect(() => dateUtils.validateIsInTheFuture('invalid')).toThrow(
        dateError.Invalid
      );
    });
  });

  describe('isGreaterThan', () => {
    it('returns true if the first date is strictly after the second date', () => {
      const date1 = new Date('2026-04-10');
      const date2 = new Date('2026-04-09');
      expect(dateUtils.isGreaterThan(date1, date2)).toBe(true);
    });

    it('returns false if the first date is before or equal to the second date', () => {
      const date1 = new Date('2026-04-09');
      const date2 = new Date('2026-04-10');
      const date3 = new Date('2026-04-09');
      expect(dateUtils.isGreaterThan(date1, date2)).toBe(false);
      expect(dateUtils.isGreaterThan(date1, date3)).toBe(false);
    });
  });

  describe('validateGreaterThan', () => {
    it('does not throw if the first date is strictly after the second date', () => {
      const date1 = new Date('2026-04-10');
      const date2 = new Date('2026-04-09');
      expect(() => dateUtils.validateGreaterThan(date1, date2)).not.toThrow();
    });

    it('throws dateError.EarlierOrEqual if the first date is before or equal to the second date', () => {
      const date1 = new Date('2026-04-09');
      const date2 = new Date('2026-04-10');
      expect(() => dateUtils.validateGreaterThan(date1, date2)).toThrow(
        dateError.EarlierOrEqual
      );
    });

    it('throws dateError.Invalid if any date is invalid', () => {
      expect(() =>
        dateUtils.validateGreaterThan('invalid', new Date())
      ).toThrow(dateError.Invalid);
      expect(() =>
        dateUtils.validateGreaterThan(new Date(), 'invalid')
      ).toThrow(dateError.Invalid);
    });
  });

  describe('isLessThan', () => {
    it('returns true if the first date is strictly before the second date', () => {
      const date1 = new Date('2026-04-09');
      const date2 = new Date('2026-04-10');
      expect(dateUtils.isLessThan(date1, date2)).toBe(true);
    });

    it('returns false if the first date is after or equal to the second date', () => {
      const date1 = new Date('2026-04-10');
      const date2 = new Date('2026-04-09');
      const date3 = new Date('2026-04-10');
      expect(dateUtils.isLessThan(date1, date2)).toBe(false);
      expect(dateUtils.isLessThan(date1, date3)).toBe(false);
    });
  });

  describe('validateLessThan', () => {
    it('does not throw if the first date is strictly before the second date', () => {
      const date1 = new Date('2026-04-09');
      const date2 = new Date('2026-04-10');
      expect(() => dateUtils.validateLessThan(date1, date2)).not.toThrow();
    });

    it('throws dateError.LaterOrEqual if the first date is after or equal to the second date', () => {
      const date1 = new Date('2026-04-10');
      const date2 = new Date('2026-04-09');
      expect(() => dateUtils.validateLessThan(date1, date2)).toThrow(
        dateError.LaterOrEqual
      );
    });

    it('throws dateError.Invalid if any date is invalid', () => {
      expect(() => dateUtils.validateLessThan('invalid', new Date())).toThrow(
        dateError.Invalid
      );
      expect(() => dateUtils.validateLessThan(new Date(), 'invalid')).toThrow(
        dateError.Invalid
      );
    });
  });

  describe('Distance functions', () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-01-15');
    const date3 = new Date('2024-02-01');
    const date4 = new Date('2024-04-01');
    const date5 = new Date('2025-01-01');

    it('getDaysDistance returns correct number of days', () => {
      expect(dateUtils.getDaysDistance({ start: date1, end: date2 })).toBe(15);
    });

    it('getWeekDistance returns correct number of weeks', () => {
      expect(dateUtils.getWeekDistance({ start: date1, end: date2 })).toBe(2);
    });

    it('getMonthDistance returns correct number of months', () => {
      expect(dateUtils.getMonthDistance({ start: date1, end: date3 })).toBe(1);
    });

    it('getQuarterDistance returns correct number of quarters', () => {
      expect(dateUtils.getQuarterDistance({ start: date1, end: date4 })).toBe(
        1
      );
    });

    it('getYearDistance returns correct number of years', () => {
      expect(dateUtils.getYearDistance({ start: date1, end: date5 })).toBe(1);
    });
  });

  describe('Adder functions', () => {
    const baseDate = new Date('2024-01-01');

    it('addDaysToDate adds correct days', () => {
      const result = dateUtils.addDaysToDate(baseDate, 10);
      expect(result.toISOString().startsWith('2024-01-11')).toBe(true);
    });

    it('addWeeksToDate adds correct weeks', () => {
      const result = dateUtils.addWeeksToDate(baseDate, 2);
      expect(result.toISOString().startsWith('2024-01-15')).toBe(true);
    });

    it('addMonthsToDate adds correct months', () => {
      const result = dateUtils.addMonthsToDate(baseDate, 2);
      expect(result.toISOString().startsWith('2024-03-01')).toBe(true);
    });

    it('addQuartersToDate adds correct quarters (3 months each)', () => {
      const result = dateUtils.addQuartersToDate(baseDate, 1);
      expect(result.toISOString().startsWith('2024-04-01')).toBe(true);
    });

    it('addYearsToDate adds correct years', () => {
      const result = dateUtils.addYearsToDate(baseDate, 2);
      expect(result.toISOString().startsWith('2026-01-01')).toBe(true);
    });
  });

  describe('isWithinRange', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    it('returns true if date is exactly the start date', () => {
      expect(
        dateUtils.isWithinRange(new Date('2024-01-01'), startDate, endDate)
      ).toBe(true);
    });

    it('returns true if date is exactly the end date', () => {
      expect(
        dateUtils.isWithinRange(new Date('2024-12-31'), startDate, endDate)
      ).toBe(true);
    });

    it('returns true if date is strictly between start and end dates', () => {
      expect(
        dateUtils.isWithinRange(new Date('2024-06-15'), startDate, endDate)
      ).toBe(true);
    });

    it('returns false if date is before the start date', () => {
      expect(
        dateUtils.isWithinRange(new Date('2023-12-31'), startDate, endDate)
      ).toBe(false);
    });

    it('returns false if date is after the end date', () => {
      expect(
        dateUtils.isWithinRange(new Date('2025-01-01'), startDate, endDate)
      ).toBe(false);
    });
  });
});
