import dayjs from 'dayjs';
import { AppError } from '../errors/error';

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
});

export default dateUtils;
