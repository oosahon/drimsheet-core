import dateUtils from '@shared/utils/date';

import { IPeriod } from '@domain/accounting/types/period.types';

export default function getPeriodContainingCurrentDate(periods: IPeriod[]) {
  const now = new Date();

  return periods.find((period) =>
    dateUtils.isWithinRange(now, period.startDate, period.endDate)
  );
}
