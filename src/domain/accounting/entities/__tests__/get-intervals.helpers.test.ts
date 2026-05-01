import dayjs from 'dayjs';
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

      expect(() => periodHelpers.getIntervals(payload)).toThrow();
    });

    it('throws InvalidDateRange if start date is after end date', () => {
      const payload = {
        startDate: new Date(`${futureYear}-12-31`),
        endDate: new Date(`${futureYear}-01-01`),
        unit: EPeriodUnit.Month,
        count: 1,
      };

      expect(() => periodHelpers.getIntervals(payload)).toThrow();
    });

    it('throws PastEndDate if end date is in the past', () => {
      const payload = {
        startDate: new Date('2000-01-01'),
        endDate: new Date('2000-12-31'),
        unit: EPeriodUnit.Month,
        count: 1,
      };

      expect(() => periodHelpers.getIntervals(payload)).toThrow();
    });

    it('throws InvalidInterval if count is not a positive number', () => {
      const payload = {
        startDate: new Date(`${futureYear}-01-01`),
        endDate: new Date(`${futureYear}-12-31`),
        unit: EPeriodUnit.Month,
        count: -1,
      };

      expect(() => periodHelpers.getIntervals(payload)).toThrow();
    });

    it('throws InvalidInterval if the total full-unit distance is less than count', () => {
      const payload = {
        startDate: new Date(`${futureYear}-01-01`),
        endDate: new Date(`${futureYear}-01-15`), // only 14 days
        unit: EPeriodUnit.Month, // asking for months
        count: 1, // asking for 1 month intervals
      };

      expect(() => periodHelpers.getIntervals(payload)).toThrow();
    });
  });

  describe('Interval Generation', () => {
    it('generates exact multiple intervals correctly (e.g. 12 month period into 12 intervals)', () => {
      const startDate = new Date(`${futureYear}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${futureYear + 1}-01-01T00:00:00.000Z`); // 12 months later

      const intervals = periodHelpers.getIntervals({
        startDate,
        endDate,
        unit: EPeriodUnit.Month,
        count: 12,
      });

      expect(intervals).toHaveLength(12);

      // Interval 1: Jan -> Feb
      expect(intervals[0].startDate).toEqual(
        new Date(`${futureYear}-01-01T00:00:00.000Z`)
      );
      expect(intervals[0].endDate).toEqual(
        new Date(`${futureYear}-02-01T00:00:00.000Z`)
      );

      // Interval 12: Dec -> Jan (next year)
      expect(intervals[11].startDate).toEqual(
        new Date(`${futureYear}-12-01T00:00:00.000Z`)
      );
      expect(intervals[11].endDate).toEqual(
        new Date(`${futureYear + 1}-01-01T00:00:00.000Z`)
      );
    });

    it('generates intervals correctly when count is smaller (e.g. 12 month period into 6 intervals -> bimonthly)', () => {
      const startDate = new Date(`${futureYear}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${futureYear + 1}-01-01T00:00:00.000Z`); // 12 months later

      const intervals = periodHelpers.getIntervals({
        startDate,
        endDate,
        unit: EPeriodUnit.Month,
        count: 6,
      });

      expect(intervals).toHaveLength(6);

      // Interval 1: Jan -> Mar
      expect(intervals[0].startDate).toEqual(
        new Date(`${futureYear}-01-01T00:00:00.000Z`)
      );
      expect(intervals[0].endDate).toEqual(
        new Date(`${futureYear}-03-01T00:00:00.000Z`)
      );

      // Interval 2: Mar -> May
      expect(intervals[1].startDate).toEqual(
        new Date(`${futureYear}-03-01T00:00:00.000Z`)
      );
      expect(intervals[1].endDate).toEqual(
        new Date(`${futureYear}-05-01T00:00:00.000Z`)
      );
    });

    it('generates intervals with a final partial period when range is not perfectly divisible (e.g. 11 months into 4 intervals)', () => {
      const startDate = new Date(`${futureYear}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${futureYear}-12-01T00:00:00.000Z`); // 11 months total

      const intervals = periodHelpers.getIntervals({
        startDate,
        endDate,
        unit: EPeriodUnit.Month,
        count: 4,
      });

      // Math.floor(11 / 4) = 2 months per interval.
      // 4 intervals total: 2m, 2m, 2m, 5m (remainder)
      expect(intervals).toHaveLength(4);

      // Interval 1: Jan -> Mar (2 months)
      expect(intervals[0].startDate).toEqual(
        new Date(`${futureYear}-01-01T00:00:00.000Z`)
      );
      expect(intervals[0].endDate).toEqual(
        new Date(`${futureYear}-03-01T00:00:00.000Z`)
      );

      // Interval 2: Mar -> May (2 months)
      expect(intervals[1].startDate).toEqual(
        new Date(`${futureYear}-03-01T00:00:00.000Z`)
      );
      expect(intervals[1].endDate).toEqual(
        new Date(`${futureYear}-05-01T00:00:00.000Z`)
      );

      // Interval 3: May -> Jul (2 months)
      expect(intervals[2].startDate).toEqual(
        new Date(`${futureYear}-05-01T00:00:00.000Z`)
      );
      expect(intervals[2].endDate).toEqual(
        new Date(`${futureYear}-07-01T00:00:00.000Z`)
      );

      // Interval 4: Jul -> Dec (5 months remainder)
      expect(intervals[3].startDate).toEqual(
        new Date(`${futureYear}-07-01T00:00:00.000Z`)
      );
      expect(intervals[3].endDate).toEqual(
        new Date(`${futureYear}-12-01T00:00:00.000Z`)
      );
    });

    it('generates exactly `count` intervals even if there is remainder days (e.g. 2.5 months into 2 intervals)', () => {
      const startDate = new Date(`${futureYear}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${futureYear}-03-15T00:00:00.000Z`); // 2.5 months

      const intervals = periodHelpers.getIntervals({
        startDate,
        endDate,
        unit: EPeriodUnit.Month,
        count: 2,
      });

      // Math.floor(2 / 2) = 1 month per interval
      // 2 intervals: 1m, 1.5m
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
        new Date(`${futureYear}-03-15T00:00:00.000Z`)
      );
    });

    it('generates days intervals correctly (e.g. 6 days inclusive into 2 intervals)', () => {
      const startDate = new Date(`${futureYear}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${futureYear}-01-06T00:00:00.000Z`); // 6 days inclusive

      const intervals = periodHelpers.getIntervals({
        startDate,
        endDate,
        unit: EPeriodUnit.Day,
        count: 2,
      });

      // Math.floor(6 / 2) = 3 days per interval
      // 2 intervals: 3 days, 3 days (inclusive logic makes them overlap on boundaries)
      expect(intervals).toHaveLength(2);

      expect(intervals[0].startDate).toEqual(
        new Date(`${futureYear}-01-01T00:00:00.000Z`)
      );
      expect(intervals[0].endDate).toEqual(
        new Date(`${futureYear}-01-04T00:00:00.000Z`)
      );

      expect(intervals[1].startDate).toEqual(
        new Date(`${futureYear}-01-04T00:00:00.000Z`)
      );
      expect(intervals[1].endDate).toEqual(
        new Date(`${futureYear}-01-06T00:00:00.000Z`)
      );
    });

    it('generates years intervals correctly (e.g. 5.5 years into 3 intervals)', () => {
      const startDate = new Date(`${futureYear}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${futureYear + 5}-06-01T00:00:00.000Z`); // 5.5 years

      const intervals = periodHelpers.getIntervals({
        startDate,
        endDate,
        unit: EPeriodUnit.Year,
        count: 3,
      });

      // Math.floor(5 / 3) = 1 year per interval
      // 3 intervals: 1 year, 1 year, 3.5 years
      expect(intervals).toHaveLength(3);

      expect(intervals[0].startDate).toEqual(
        new Date(`${futureYear}-01-01T00:00:00.000Z`)
      );
      expect(intervals[0].endDate).toEqual(
        new Date(`${futureYear + 1}-01-01T00:00:00.000Z`)
      );

      expect(intervals[1].startDate).toEqual(
        new Date(`${futureYear + 1}-01-01T00:00:00.000Z`)
      );
      expect(intervals[1].endDate).toEqual(
        new Date(`${futureYear + 2}-01-01T00:00:00.000Z`)
      );

      expect(intervals[2].startDate).toEqual(
        new Date(`${futureYear + 2}-01-01T00:00:00.000Z`)
      );
      expect(intervals[2].endDate).toEqual(
        new Date(`${futureYear + 5}-06-01T00:00:00.000Z`)
      );
    });
  });
});
