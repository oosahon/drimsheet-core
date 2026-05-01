import dateUtils from '../../../../shared/utils/date';
import stringUtils from '../../../../shared/utils/string';
import periodError from '../../errors/period.error';
import { IFiscalYear } from '../../types/fiscal-year.types';
import periodHelpers from './period.helpers';

function validateStartAndEndDate(
  payload: Pick<IFiscalYear, 'startDate' | 'endDate'>
) {
  periodHelpers.validateStartAndEndDate(payload);

  const monthDistance = dateUtils.getMonthDistance({
    start: payload.startDate,
    end: payload.endDate,
  });

  const isInvalidDistance = monthDistance > 23 || monthDistance < 1;

  if (isInvalidDistance) {
    throw new periodError.InvalidDateRange();
  }
}

function deriveName(
  startDate: Date,
  endDate: Date,
  name: string | null,
  validate = true
) {
  if (name) {
    return stringUtils.sanitizeAndValidate(name, { min: 1, max: 100 });
  }

  if (validate) {
    validateStartAndEndDate({ startDate, endDate });
  }

  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  if (startYear === endYear) {
    return `${startYear}`;
  }

  return `${startYear} - ${endYear}`;
}

const fiscalYearEntityHelpers = Object.freeze({
  validateStartAndEndDate,
  validateStatus: periodHelpers.validateStatus,
  deriveName,
});

export default fiscalYearEntityHelpers;
