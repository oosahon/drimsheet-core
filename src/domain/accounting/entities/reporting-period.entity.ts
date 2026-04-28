import { TEntityWithEvents } from '../../../shared/types/event.types';
import stringUtils from '../../../shared/utils/string';
import { IFiscalYear } from '../types/fiscal-year.types';
import { IAccountingPeriod, IReportingPeriod } from '../types/period.types';
import periodHelpers from './helpers/period.helpers';

interface IMakePayload extends Pick<
  IAccountingPeriod,
  'accountingEntityId' | 'unit' | 'count'
> {
  fiscalYear: IFiscalYear;
}

function make(
  payload: IMakePayload
): TEntityWithEvents<IReportingPeriod[], IReportingPeriod[]> {
  stringUtils.validateUUID(payload.accountingEntityId);
  periodHelpers.validateUnit(payload.unit);

  const intervals = periodHelpers.getIntervals({
    startDate: payload.fiscalYear.startDate,
    endDate: payload.fiscalYear.endDate,
    unit: payload.unit,
    count: payload.count,
  });

  const timestamp = new Date();

  const reportingPeriods: IReportingPeriod[] = intervals.map(
    (interval, index) =>
      Object.freeze({
        id: stringUtils.generateUUID(),
        name: `Reporting Period ${index + 1}`,
        accountingEntityId: payload.accountingEntityId,
        unit: payload.unit,
        count: payload.count,
        startDate: interval.startDate,
        endDate: interval.endDate,
        fiscalYearId: payload.fiscalYear.id,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
  );

  return [reportingPeriods, []];
}

const reportingPeriodEntity = Object.freeze({
  make,
});

export default reportingPeriodEntity;
