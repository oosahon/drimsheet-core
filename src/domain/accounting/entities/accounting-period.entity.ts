import stringUtils from '../../../shared/utils/string';
import { TAuditedEntity } from '../../../shared/values/events/types/event.types';
import accountingError from '../errors/accounting.error';
import periodEvents from '../events/period.events';
import { IFiscalYear } from '../types/fiscal-year.types';
import { EPeriodActions } from '../types/period-audit.types';
import { EPeriodStatus, IAccountingPeriod } from '../types/period.types';
import accountingPeriodAudit from '../values/accounting-period-audit.vo';
import periodHelpers from './helpers/period.helpers';

interface IMakePayload extends Pick<
  IAccountingPeriod,
  'accountingEntityId' | 'unit' | 'count'
> {
  fiscalYear: IFiscalYear;
}

function make(
  payload: IMakePayload
): TAuditedEntity<IAccountingPeriod, IAccountingPeriod, IAccountingPeriod>[] {
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

  return accountingPeriods.map((period) => {
    const event = periodEvents.accountingPeriodCreated(period);
    const audit = accountingPeriodAudit.make({
      before: null,
      after: period,
      action: EPeriodActions.Created,
    });

    return [period, [event], audit];
  });
}

const accountingPeriodEntity = Object.freeze({
  make,
});

export default accountingPeriodEntity;
