import dayjs from 'dayjs';
import periodErrors from '../../errors/period.errors';
import { EPeriodUnit } from '../../types/period.types';
import periodHelpers from '../helpers/period.helpers';

describe('Period Helpers - getIntervals', () => {
  const futureYear = dayjs().year() + 10; // Ensure dates are always in the future to pass `endDateIsInThePast` validation

  describe('Validation', () => {
    it('throws InvalidUnit if unit is not a valid EPeriodUnit', () => {
      const payload = {
        startDate: new Date(`${futureYear}-01-01`),
        endDate: new Date(`${futureYear}-12-31`),
        unit: 'invalid_unit' as any,
        count: 1,
      };

      expect(() => periodHelpers.getIntervals(payload)).toThrow(
        periodErrors.InvalidUnit
      );
    });

    it('throws InvalidDateRange if start date is after end date', () => {
      const payload = {
        startDate: new Date(`${futureYear}-12-31`),
        endDate: new Date(`${futureYear}-01-01`),
        unit: EPeriodUnit.Month,
        count: 1,
      };

      expect(() => periodHelpers.getIntervals(payload)).toThrow(
        periodErrors.InvalidDateRange
      );
    });

    it('throws EndDateIsInThePast if end date is in the past', () => {
      const payload = {
        startDate: new Date('2000-01-01'),
        endDate: new Date('2000-12-31'),
        unit: EPeriodUnit.Month,
        count: 1,
      };

      expect(() => periodHelpers.getIntervals(payload)).toThrow(
        periodErrors.EndDateIsInThePast
      );
    });

    it('throws InvalidInterval if count is not a positive number', () => {
      const payload = {
        startDate: new Date(`${futureYear}-01-01`),
        endDate: new Date(`${futureYear}-12-31`),
        unit: EPeriodUnit.Month,
        count: -1,
      };

      expect(() => periodHelpers.getIntervals(payload)).toThrow(
        periodErrors.InvalidInterval
      );
    });

    it('throws InvalidInterval if the total full-unit distance is less than count', () => {
      const payload = {
        startDate: new Date(`${futureYear}-01-01`),
        endDate: new Date(`${futureYear}-01-15`), // only 14 days
        unit: EPeriodUnit.Month, // asking for months
        count: 1, // asking for 1 month intervals
      };

      expect(() => periodHelpers.getIntervals(payload)).toThrow(
        periodErrors.InvalidInterval
      );
    });
  });

  describe('Interval Generation', () => {
    it('generates exact multiple intervals correctly (e.g. 2 months evenly divisible by 1 month)', () => {
      const startDate = new Date(`${futureYear}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${futureYear}-03-01T00:00:00.000Z`);

      const intervals = periodHelpers.getIntervals({
        startDate,
        endDate,
        unit: EPeriodUnit.Month,
        count: 1,
      });

      expect(intervals).toHaveLength(2);

      expect(intervals[0].startDate).toEqual(
        new Date(`${futureYear}-01-01T00:00:00.000Z`)
      );
      expect(intervals[0].endDate).toEqual(
        new Date(`${futureYear}-02-01T00:00:00.000Z`)
      );

      expect(intervals[1].startDate).toEqual(
        new Date(`${futureYear}-02-01T00:00:00.000Z`)
      );
      expect(intervals[1].endDate).toEqual(
        new Date(`${futureYear}-03-01T00:00:00.000Z`)
      );
    });

    it('generates intervals with a final partial period when range is not perfectly divisible (e.g. quarters remainder)', () => {
      const startDate = new Date(`${futureYear}-02-01T00:00:00.000Z`);
      const endDate = new Date(`${futureYear}-12-31T00:00:00.000Z`); // 11 months total

      const intervals = periodHelpers.getIntervals({
        startDate,
        endDate,
        unit: EPeriodUnit.Quarter, // 3 months
        count: 1,
      });

      // 11 months / 3 months = 3 full quarters + 2 months remainder -> 4 intervals
      expect(intervals).toHaveLength(4);

      // Interval 1: Feb 1 -> May 1
      expect(intervals[0].startDate).toEqual(
        new Date(`${futureYear}-02-01T00:00:00.000Z`)
      );
      expect(intervals[0].endDate).toEqual(
        new Date(`${futureYear}-05-01T00:00:00.000Z`)
      );

      // Interval 2: May 1 -> Aug 1
      expect(intervals[1].startDate).toEqual(
        new Date(`${futureYear}-05-01T00:00:00.000Z`)
      );
      expect(intervals[1].endDate).toEqual(
        new Date(`${futureYear}-08-01T00:00:00.000Z`)
      );

      // Interval 3: Aug 1 -> Nov 1
      expect(intervals[2].startDate).toEqual(
        new Date(`${futureYear}-08-01T00:00:00.000Z`)
      );
      expect(intervals[2].endDate).toEqual(
        new Date(`${futureYear}-11-01T00:00:00.000Z`)
      );

      // Interval 4: Nov 1 -> Dec 31 (capped at endDate)
      expect(intervals[3].startDate).toEqual(
        new Date(`${futureYear}-11-01T00:00:00.000Z`)
      );
      expect(intervals[3].endDate).toEqual(
        new Date(`${futureYear}-12-31T00:00:00.000Z`)
      );
    });

    it('generates partial final periods correctly even if total distance is an exact multiple of the unit but there is remainder days', () => {
      const startDate = new Date(`${futureYear}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${futureYear}-03-15T00:00:00.000Z`);

      const intervals = periodHelpers.getIntervals({
        startDate,
        endDate,
        unit: EPeriodUnit.Month,
        count: 1,
      });

      // 2 months + 14 days -> 3 intervals
      expect(intervals).toHaveLength(3);

      expect(intervals[0].startDate).toEqual(
        new Date(`${futureYear}-01-01T00:00:00.000Z`)
      );
      expect(intervals[0].endDate).toEqual(
        new Date(`${futureYear}-02-01T00:00:00.000Z`)
      );

      expect(intervals[1].startDate).toEqual(
        new Date(`${futureYear}-02-01T00:00:00.000Z`)
      );
      expect(intervals[1].endDate).toEqual(
        new Date(`${futureYear}-03-01T00:00:00.000Z`)
      );

      expect(intervals[2].startDate).toEqual(
        new Date(`${futureYear}-03-01T00:00:00.000Z`)
      );
      expect(intervals[2].endDate).toEqual(
        new Date(`${futureYear}-03-15T00:00:00.000Z`)
      );
    });

    it('generates days intervals correctly', () => {
      const startDate = new Date(`${futureYear}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${futureYear}-01-06T00:00:00.000Z`);

      const intervals = periodHelpers.getIntervals({
        startDate,
        endDate,
        unit: EPeriodUnit.Day,
        count: 2,
      });

      // 5 days distance, 2 days interval -> 3 intervals
      expect(intervals).toHaveLength(3);

      expect(intervals[0].endDate).toEqual(
        new Date(`${futureYear}-01-03T00:00:00.000Z`)
      );
      expect(intervals[1].endDate).toEqual(
        new Date(`${futureYear}-01-05T00:00:00.000Z`)
      );
      expect(intervals[2].endDate).toEqual(
        new Date(`${futureYear}-01-06T00:00:00.000Z`)
      ); // capped
    });

    it('generates weeks intervals correctly', () => {
      const startDate = new Date(`${futureYear}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${futureYear}-01-22T00:00:00.000Z`); // 3 weeks

      const intervals = periodHelpers.getIntervals({
        startDate,
        endDate,
        unit: EPeriodUnit.Week,
        count: 1,
      });

      expect(intervals).toHaveLength(3);
      expect(intervals[0].endDate).toEqual(
        new Date(`${futureYear}-01-08T00:00:00.000Z`)
      );
      expect(intervals[1].endDate).toEqual(
        new Date(`${futureYear}-01-15T00:00:00.000Z`)
      );
      expect(intervals[2].endDate).toEqual(
        new Date(`${futureYear}-01-22T00:00:00.000Z`)
      );
    });

    it('generates years intervals correctly', () => {
      const startDate = new Date(`${futureYear}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${futureYear + 5}-06-01T00:00:00.000Z`); // 5.5 years

      const intervals = periodHelpers.getIntervals({
        startDate,
        endDate,
        unit: EPeriodUnit.Year,
        count: 2,
      });

      // 2 years + 2 years + 1.5 years -> 3 intervals
      expect(intervals).toHaveLength(3);
      expect(intervals[0].endDate).toEqual(
        new Date(`${futureYear + 2}-01-01T00:00:00.000Z`)
      );
      expect(intervals[1].endDate).toEqual(
        new Date(`${futureYear + 4}-01-01T00:00:00.000Z`)
      );
      expect(intervals[2].endDate).toEqual(
        new Date(`${futureYear + 5}-06-01T00:00:00.000Z`)
      ); // capped
    });
  });
});
