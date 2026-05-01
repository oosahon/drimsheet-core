import { TEntityWithEvents } from '../../../shared/types/event.types';
import stringUtils from '../../../shared/utils/string';
import accountingError from '../errors/accounting.error';
import periodEvents from '../events/period.events';
import { IFiscalYear } from '../types/fiscal-year.types';
import { EPeriodStatus, IAccountingPeriod } from '../types/period.types';
import periodHelpers from './helpers/period.helpers';

interface IMakePayload extends Pick<
  IAccountingPeriod,
  'accountingEntityId' | 'unit' | 'count'
> {
  fiscalYear: IFiscalYear;
}

function make(
  payload: IMakePayload
): TEntityWithEvents<IAccountingPeriod, IAccountingPeriod>[] {
  stringUtils.validateUUID(
    payload.accountingEntityId,
    accountingError.InvalidValue
  );
  periodHelpers.validateUnit(payload.unit);

  const intervals = periodHelpers.getIntervals({
    startDate: payload.fiscalYear.startDate,
    endDate: payload.fiscalYear.endDate,
    unit: payload.unit,
    count: payload.count,
  });

  const timestamp = new Date();

  const accountingPeriods: IAccountingPeriod[] = intervals.map(
    (interval, index) =>
      Object.freeze({
        id: stringUtils.generateUUID(),
        name: `Accounting Period ${index + 1}`,
        accountingEntityId: payload.accountingEntityId,
        unit: payload.unit,
        count: payload.count,
        startDate: interval.startDate,
        endDate: interval.endDate,
        status: EPeriodStatus.Open,
        fiscalYearId: payload.fiscalYear.id,
        createdAt: timestamp,
        updatedAt: timestamp,
        closedAt: null,
      })
  );

  return accountingPeriods.map((period) => [
    period,
    [periodEvents.accountingPeriodCreated(period)],
  ]);
}

const accountingPeriodEntity = Object.freeze({
  make,
});

export default accountingPeriodEntity;
