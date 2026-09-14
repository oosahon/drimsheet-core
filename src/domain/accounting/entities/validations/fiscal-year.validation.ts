import dateUtils from '@shared/utils/date';

import periodValidation from '@domain/accounting/entities/validations/period.validation';
import periodError from '@domain/accounting/errors/period.error';
import { IFiscalYear } from '@domain/accounting/types/fiscal-year.types';

function validateStartAndEndDate(
  payload: Pick<IFiscalYear, 'startDate' | 'endDate'>
) {
  periodValidation.validateStartAndEndDate(payload);

  const monthDistance = dateUtils.getMonthDistance({
    start: payload.startDate,
    end: payload.endDate,
  });

  const isInvalidDistance = monthDistance < 1;

  if (isInvalidDistance) {
    throw new periodError.InvalidDateRange();
  }
}

const fiscalYearValidation = Object.freeze({
  validateStartAndEndDate,
  validateStatus: periodValidation.validateStatus,
});

export default fiscalYearValidation;
