import dateUtils from '../date';
import { AppError } from '../../value-objects/error';
import dayjs from 'dayjs';

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
});
