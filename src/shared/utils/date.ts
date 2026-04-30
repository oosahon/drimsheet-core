import dayjs from 'dayjs';
import { AppError } from '../errors/error';

export interface IStartAndEndDates {
  start: Date;
  end: Date;
}

function isValidDate(date: Date | string | number) {
  return dayjs(date).isValid();
}

function validateDate(date: Date | string | number) {
  if (!isValidDate(date)) {
    throw new AppError('Invalid date', { cause: date });
  }
}

function isNotInThePast(date: Date | string | number) {
  return dayjs(date).isAfter(dayjs());
}

function validateDateIsNotInThePast(date: Date | string | number) {
  if (!isNotInThePast(date)) {
    throw new AppError('Date is in the past', { cause: date });
  }
}

function isNotInTheFuture(date: Date | string | number) {
  return dayjs(date).isBefore(dayjs());
}

function validateDateIsNotInTheFuture(date: Date | string | number) {
  if (!isNotInTheFuture(date)) {
    throw new AppError('Date is in the future', { cause: date });
  }
}

function isInTheFuture(date: Date | string | number) {
  return isValidDate(date) && dayjs(date).isAfter(dayjs());
}

function validateIsInTheFuture(date: Date | string | number) {
  if (!isValidDate(date)) {
    throw new AppError('Invalid date', { cause: date });
  }
  if (!isInTheFuture(date)) {
    throw new AppError('Date is not in the future', { cause: date });
  }
}

function isGreaterThan(
  date: Date | string | number,
  dateToCompare: Date | string | number
) {
  return dayjs(date).isAfter(dayjs(dateToCompare));
}

function validateGreaterThan(
  date: Date | string | number,
  dateToCompare: Date | string | number,
  message?: string
) {
  if (!isValidDate(date) || !isValidDate(dateToCompare)) {
    throw new AppError('Invalid date');
  }
  if (!isGreaterThan(date, dateToCompare)) {
    throw new AppError(
      message || 'Date is not greater than the comparison date',
      { cause: { date, dateToCompare } }
    );
  }
}

function isLessThan(
  date: Date | string | number,
  dateToCompare: Date | string | number
) {
  return dayjs(date).isBefore(dayjs(dateToCompare));
}

function validateLessThan(
  date: Date | string | number,
  dateToCompare: Date | string | number,
  message?: string
) {
  if (!isValidDate(date) || !isValidDate(dateToCompare)) {
    throw new AppError('Invalid date');
  }
  if (!isLessThan(date, dateToCompare)) {
    throw new AppError(message || 'Date is not less than the comparison date', {
      cause: { date, dateToCompare },
    });
  }
}

function getDaysDistance({ start, end }: IStartAndEndDates) {
  validateDate(start);
  validateDate(end);

  return Math.round(dayjs(end).add(1, 'day').diff(dayjs(start), 'day', true));
}

function getWeekDistance({ start, end }: IStartAndEndDates) {
  validateDate(start);
  validateDate(end);

  return Math.round(dayjs(end).add(1, 'day').diff(dayjs(start), 'week', true));
}

function getMonthDistance({ start, end }: IStartAndEndDates) {
  validateDate(start);
  validateDate(end);

  return Math.round(dayjs(end).add(1, 'day').diff(dayjs(start), 'month', true));
}

function getQuarterDistance({ start, end }: IStartAndEndDates) {
  validateDate(start);
  validateDate(end);

  return Math.round(
    dayjs(end).add(1, 'day').diff(dayjs(start), 'quarter', true)
  );
}

function getYearDistance({ start, end }: IStartAndEndDates) {
  validateDate(start);
  validateDate(end);

  return Math.round(dayjs(end).add(1, 'day').diff(dayjs(start), 'year', true));
}

function addDaysToDate(date: Date | string | number, days: number) {
  validateDate(date);
  return dayjs(date).add(days, 'day').toDate();
}

function addWeeksToDate(date: Date | string | number, weeks: number) {
  validateDate(date);
  return dayjs(date).add(weeks, 'week').toDate();
}

function addMonthsToDate(date: Date | string | number, months: number) {
  validateDate(date);
  return dayjs(date).add(months, 'month').toDate();
}

function addQuartersToDate(date: Date | string | number, quarters: number) {
  validateDate(date);
  return dayjs(date)
    .add(quarters * 3, 'month')
    .toDate();
}

function addYearsToDate(date: Date | string | number, years: number) {
  validateDate(date);
  return dayjs(date).add(years, 'year').toDate();
}

function isWithinRange(
  date: Date | string | number,
  startDate: Date | string | number,
  endDate: Date | string | number
) {
  const target = dayjs(date);
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  return (
    (target.isAfter(start) || target.isSame(start)) &&
    (target.isBefore(end) || target.isSame(end))
  );
}

const dateUtils = Object.freeze({
  isValidDate,
  validateDate,

  isNotInThePast,
  validateDateIsNotInThePast,

  isNotInTheFuture,
  validateDateIsNotInTheFuture,

  isInTheFuture,
  validateIsInTheFuture,

  isGreaterThan,
  validateGreaterThan,

  isLessThan,
  validateLessThan,

  getMonthDistance,
  getWeekDistance,
  getQuarterDistance,
  getDaysDistance,
  getYearDistance,

  addDaysToDate,
  addWeeksToDate,
  addMonthsToDate,
  addQuartersToDate,
  addYearsToDate,

  isWithinRange,
});

export default dateUtils;
