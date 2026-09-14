import dateUtils from '@shared/utils/date';

import errors from '@domain/accounting/errors/period.error';
import {
  EPeriodStatus,
  EPeriodUnit,
  IPeriod,
  UPeriodStatus,
  UPeriodUnit,
} from '@domain/accounting/types/period.types';

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
    throw new errors.PastEndDate();
  }
}

const periodValidation = Object.freeze({
  isValidUnit,
  validateUnit,

  isValidStatus,
  validateStatus,

  validateStartAndEndDate,
});

export default periodValidation;
