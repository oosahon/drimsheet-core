import stringUtils from '@shared/utils/string';
import { TAuditedEntity } from '@shared/values/events/types/event.types';

import getPeriodIntervals from '@domain/accounting/entities/helpers/get-intervals.helper';
import periodValidation from '@domain/accounting/entities/validations/period.validation';
import accountingError from '@domain/accounting/errors/accounting.error';
import periodEvents from '@domain/accounting/events/period.events';
import { IFiscalYear } from '@domain/accounting/types/fiscal-year.types';
import { EPeriodActions } from '@domain/accounting/types/period-audit.types';
import {
  EPeriodStatus,
  IAccountingPeriod,
} from '@domain/accounting/types/period.types';
import accountingPeriodAudit from '@domain/accounting/values/accounting-period-audit.vo';

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
  periodValidation.validateUnit(payload.unit);

  const intervals = getPeriodIntervals({
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
