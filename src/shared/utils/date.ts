import dayjs from 'dayjs';

import { TErrorConstructor } from '@shared/types/error.types';
import dateError from '@shared/values/errors/date.error';

export interface IStartAndEndDates {
  start: Date;
  end: Date;
}

function isValidDate(date: Date | string | number) {
  return dayjs(date).isValid();
}

function validateDate<T extends Error>(
  date: Date | string | number,
  ErrorClass: TErrorConstructor<T>
) {
  if (!isValidDate(date)) {
    throw new ErrorClass({ date });
  }
}

function isNotInThePast(date: Date | string | number) {
  return dayjs(date).isAfter(dayjs());
}

function validateDateIsNotInThePast<T extends Error>(
  date: Date | string | number,
  ErrorClass: TErrorConstructor<T>
) {
  if (!isNotInThePast(date)) {
    throw new ErrorClass({ date });
  }
}

function isNotInTheFuture(date: Date | string | number) {
  return dayjs(date).isBefore(dayjs());
}

function validateDateIsNotInTheFuture<T extends Error>(
  date: Date | string | number,
  ErrorClass: TErrorConstructor<T>
) {
  if (!isNotInTheFuture(date)) {
    throw new ErrorClass({ date });
  }
}

function isInTheFuture(date: Date | string | number) {
  return isValidDate(date) && dayjs(date).isAfter(dayjs());
}

function validateIsInTheFuture<T extends Error>(
  date: Date | string | number,
  ErrorClass: TErrorConstructor<T>
) {
  if (!isValidDate(date)) {
    throw new ErrorClass({ date });
  }
  if (!isInTheFuture(date)) {
    throw new ErrorClass({ date });
  }
}

function isGreaterThan(
  date: Date | string | number,
  dateToCompare: Date | string | number
) {
  return dayjs(date).isAfter(dayjs(dateToCompare));
}

function validateGreaterThan<T extends Error>(
  date: Date | string | number,
  dateToCompare: Date | string | number,
  ErrorClass: TErrorConstructor<T>
) {
  if (!isValidDate(date) || !isValidDate(dateToCompare)) {
    throw new ErrorClass({ date, dateToCompare });
  }
  if (!isGreaterThan(date, dateToCompare)) {
    throw new ErrorClass({ date, dateToCompare });
  }
}

function isLessThan(
  dateToValidate: Date | string | number,
  referenceDate: Date | string | number
) {
  return dayjs(dateToValidate).isBefore(dayjs(referenceDate));
}

function validateLessThan<T extends Error>(
  date: Date | string | number,
  dateToCompare: Date | string | number,
  ErrorClass: TErrorConstructor<T>
) {
  if (!isValidDate(date) || !isValidDate(dateToCompare)) {
    throw new ErrorClass({ date, dateToCompare });
  }
  if (!isLessThan(date, dateToCompare)) {
    throw new ErrorClass({ date, dateToCompare });
  }
}

function getDaysDistance({ start, end }: IStartAndEndDates) {
  if (!isValidDate(start) || !isValidDate(end))
    throw new dateError.InvalidDates();
  return Math.round(dayjs(end).add(1, 'day').diff(dayjs(start), 'day', true));
}

function getWeekDistance({ start, end }: IStartAndEndDates) {
  if (!isValidDate(start) || !isValidDate(end))
    throw new dateError.InvalidDates();
  return Math.round(dayjs(end).add(1, 'day').diff(dayjs(start), 'week', true));
}

function getMonthDistance({ start, end }: IStartAndEndDates) {
  if (!isValidDate(start) || !isValidDate(end))
    throw new dateError.InvalidDates();
  return Math.round(dayjs(end).add(1, 'day').diff(dayjs(start), 'month', true));
}

function getQuarterDistance({ start, end }: IStartAndEndDates) {
  if (!isValidDate(start) || !isValidDate(end))
    throw new dateError.InvalidDates();
  return Math.round(
    dayjs(end).add(1, 'day').diff(dayjs(start), 'quarter', true)
  );
}

function getYearDistance({ start, end }: IStartAndEndDates) {
  if (!isValidDate(start) || !isValidDate(end))
    throw new dateError.InvalidDates();
  return Math.round(dayjs(end).add(1, 'day').diff(dayjs(start), 'year', true));
}

function addDaysToDate(date: Date | string | number, days: number) {
  if (!isValidDate(date)) throw new dateError.InvalidDate();
  return dayjs(date).add(days, 'day').toDate();
}

function addWeeksToDate(date: Date | string | number, weeks: number) {
  if (!isValidDate(date)) throw new dateError.InvalidDate();
  return dayjs(date).add(weeks, 'week').toDate();
}

function addMonthsToDate(date: Date | string | number, months: number) {
  if (!isValidDate(date)) throw new dateError.InvalidDate();
  return dayjs(date).add(months, 'month').toDate();
}

function addQuartersToDate(date: Date | string | number, quarters: number) {
  if (!isValidDate(date)) throw new dateError.InvalidDate();
  return dayjs(date)
    .add(quarters * 3, 'month')
    .toDate();
}

function addYearsToDate(date: Date | string | number, years: number) {
  if (!isValidDate(date)) throw new dateError.InvalidDate();
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

function fromString<T extends Error>(
  string: string,
  ErrorClass: TErrorConstructor<T>
) {
  const date = dayjs(string);

  if (!date.isValid()) {
    throw new ErrorClass({ date: string });
  }

  return date.toDate();
}

function isSameDay(
  date1: Date | string | number,
  date2: Date | string | number
) {
  return dayjs(date1).isSame(dayjs(date2), 'day');
}

const dateUtils = Object.freeze({
  isValidDate,
  isSameDay,
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
  fromString,
});

export default dateUtils;
