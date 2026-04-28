import dayjs from 'dayjs';
import { AppError } from '../../errors/error';
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

    it('throws AppError for an invalid date', () => {
      expect(() => dateUtils.validateDate('invalid-date')).toThrow(AppError);
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

    it('throws AppError for a past date', () => {
      const pastDate = dayjs().subtract(1, 'day').toDate();
      expect(() => dateUtils.validateDateIsNotInThePast(pastDate)).toThrow(
        AppError
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

    it('throws AppError for a future date', () => {
      const futureDate = dayjs().add(1, 'day').toDate();
      expect(() => dateUtils.validateDateIsNotInTheFuture(futureDate)).toThrow(
        AppError
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

    it('throws AppError for a past date', () => {
      const pastDate = dayjs().subtract(1, 'day').toDate();
      expect(() => dateUtils.validateIsInTheFuture(pastDate)).toThrow(AppError);
    });

    it('throws AppError for an invalid date', () => {
      expect(() => dateUtils.validateIsInTheFuture('invalid')).toThrow(
        AppError
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

    it('throws AppError if the first date is before or equal to the second date', () => {
      const date1 = new Date('2026-04-09');
      const date2 = new Date('2026-04-10');
      expect(() => dateUtils.validateGreaterThan(date1, date2)).toThrow(
        AppError
      );
    });

    it('throws AppError if any date is invalid', () => {
      expect(() =>
        dateUtils.validateGreaterThan('invalid', new Date())
      ).toThrow(AppError);
      expect(() =>
        dateUtils.validateGreaterThan(new Date(), 'invalid')
      ).toThrow(AppError);
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

    it('throws AppError if the first date is after or equal to the second date', () => {
      const date1 = new Date('2026-04-10');
      const date2 = new Date('2026-04-09');
      expect(() => dateUtils.validateLessThan(date1, date2)).toThrow(AppError);
    });

    it('throws AppError if any date is invalid', () => {
      expect(() => dateUtils.validateLessThan('invalid', new Date())).toThrow(
        AppError
      );
      expect(() => dateUtils.validateLessThan(new Date(), 'invalid')).toThrow(
        AppError
      );
    });
  });
});
