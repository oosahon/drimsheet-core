import dateUtils from '../../../../shared/utils/date';
import numberUtils from '../../../../shared/utils/number';
import errors from '../../errors/period.errors';
import {
  EPeriodStatus,
  EPeriodUnit,
  IPeriod,
  UPeriodStatus,
  UPeriodUnit,
} from '../../types/period.types';

function isValidUnit(unit: unknown): unit is UPeriodUnit {
  return Object.values(EPeriodUnit).includes(unit as UPeriodUnit);
}

function validateUnit(unit: unknown) {
  if (!isValidUnit(unit)) {
    throw new errors.InvalidUnit();
  }
}

function isValidStatus(status: unknown): status is UPeriodStatus {
  return Object.values(EPeriodStatus).includes(status as UPeriodStatus);
}

function validateStatus(status: unknown) {
  if (!isValidStatus(status)) {
    throw new errors.InvalidStatus();
  }
}

function validateStartAndEndDate(
  payload: Pick<IPeriod, 'startDate' | 'endDate'>
) {
  const isValidStartDate = dateUtils.isValidDate(payload.startDate);
  const isValidEndDate = dateUtils.isValidDate(payload.endDate);

  if (!isValidStartDate || !isValidEndDate) {
    throw new errors.InvalidDateRange();
  }

  const isInvalidRange = dateUtils.isGreaterThan(
    payload.startDate,
    payload.endDate
  );

  if (isInvalidRange) {
    throw new errors.InvalidDateRange();
  }

  const endDateIsInThePast = dateUtils.isGreaterThan(
    new Date(),
    payload.endDate
  );

  if (endDateIsInThePast) {
    throw new errors.EndDateIsInThePast();
  }
}

function getIntervals(
  payload: Pick<IPeriod, 'startDate' | 'endDate' | 'unit' | 'count'>
) {
  const { startDate, endDate, unit, count } = payload;

  validateUnit(unit);

  validateStartAndEndDate({ startDate, endDate });

  const isValidCount = numberUtils.isPositiveNumber(count);
  if (!isValidCount) {
    throw new errors.InvalidInterval();
  }

  dateUtils.validateDate(startDate);
  dateUtils.validateDate(endDate);

  const distanceMaps = {
    [EPeriodUnit.Day]: dateUtils.getDaysDistance,
    [EPeriodUnit.Week]: dateUtils.getWeekDistance,
    [EPeriodUnit.Month]: dateUtils.getMonthDistance,
    [EPeriodUnit.Quarter]: dateUtils.getQuarterDistance,
    [EPeriodUnit.Year]: dateUtils.getYearDistance,
  };

  const distanceFn = distanceMaps[unit];

  let distance = distanceFn({ start: startDate, end: endDate });

  if (distance < count) {
    throw new errors.InvalidInterval();
  }

  const intervalSize = Math.floor(distance / count);

  const adderMaps = {
    [EPeriodUnit.Day]: dateUtils.addDaysToDate,
    [EPeriodUnit.Week]: dateUtils.addWeeksToDate,
    [EPeriodUnit.Month]: dateUtils.addMonthsToDate,
    [EPeriodUnit.Quarter]: dateUtils.addQuartersToDate,
    [EPeriodUnit.Year]: dateUtils.addYearsToDate,
  };

  const adder = adderMaps[unit];

  const intervals: Pick<IPeriod, 'startDate' | 'endDate'>[] = [];

  let startOfInterval = startDate;

  for (let i = 0; i < count; i++) {
    if (i === count - 1) {
      intervals.push({
        startDate: startOfInterval,
        endDate,
      });
    } else {
      const nextEndDate = adder(startOfInterval, intervalSize);
      intervals.push({
        startDate: startOfInterval,
        endDate: nextEndDate,
      });
      startOfInterval = nextEndDate;
    }
  }

  return intervals;
}

function getCurrentPeriod(periods: IPeriod[]) {
  const now = new Date();

  const period = periods.find((period) =>
    dateUtils.isWithinRange(now, period.startDate, period.endDate)
  );

  return period;
}

const periodHelpers = Object.freeze({
  isValidUnit,
  validateUnit,

  isValidStatus,
  validateStatus,

  validateStartAndEndDate,
  getIntervals,

  getCurrentPeriod,
});

export default periodHelpers;
