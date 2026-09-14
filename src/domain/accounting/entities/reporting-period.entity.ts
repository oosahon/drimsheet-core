import stringUtils from '@shared/utils/string';
import { TAuditedEntity } from '@shared/values/events/types/event.types';

import getPeriodIntervals from '@domain/accounting/entities/helpers/get-intervals.helper';
import periodValidation from '@domain/accounting/entities/validations/period.validation';
import periodError from '@domain/accounting/errors/period.error';
import periodEvents from '@domain/accounting/events/period.events';
import { IFiscalYear } from '@domain/accounting/types/fiscal-year.types';
import { EPeriodActions } from '@domain/accounting/types/period-audit.types';
import {
  IAccountingPeriod,
  IReportingPeriod,
} from '@domain/accounting/types/period.types';
import reportingPeriodAudit from '@domain/accounting/values/reporting-period-audit.vo';

interface IMakePayload extends Pick<
  IAccountingPeriod,
  'accountingEntityId' | 'unit' | 'count'
> {
  fiscalYear: IFiscalYear;
}

function make(
  payload: IMakePayload
): TAuditedEntity<IReportingPeriod, IReportingPeriod, IReportingPeriod>[] {
  stringUtils.validateUUID(
    payload.accountingEntityId,
    periodError.InvalidAccountingEntityId
  );
  periodValidation.validateUnit(payload.unit);

  const intervals = getPeriodIntervals({
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

  return reportingPeriods.map((period) => {
    const event = periodEvents.reportingPeriodCreated(period);
    const audit = reportingPeriodAudit.make({
      before: null,
      after: period,
      action: EPeriodActions.Created,
    });

    return [period, [event], audit];
  });
}

const reportingPeriodEntity = Object.freeze({
  make,
});

export default reportingPeriodEntity;
