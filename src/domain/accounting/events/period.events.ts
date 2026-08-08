import eventValue from '@shared/values/events/event.vo';

import { IFiscalYear } from '@domain/accounting/types/fiscal-year.types';
import {
  IAccountingPeriod,
  IReportingPeriod,
} from '@domain/accounting/types/period.types';

export const EPeriodEvents = {
  FiscalYearCreated: 'domain:accounting:period:fiscal-year:created',
  AccountingPeriodCreated: 'domain:accounting:period:accounting-period:created',
  ReportingPeriodCreated: 'domain:accounting:period:reporting-period:created',
} as const;

function makeFiscalYearCreatedEvent(params: IFiscalYear) {
  return eventValue.make<IFiscalYear>({
    type: EPeriodEvents.FiscalYearCreated,
    data: params,
  });
}

function makeAccountingPeriodCreatedEvent(params: IAccountingPeriod) {
  return eventValue.make<IAccountingPeriod>({
    type: EPeriodEvents.AccountingPeriodCreated,
    data: params,
  });
}

function makeReportingPeriodCreatedEvent(params: IReportingPeriod) {
  return eventValue.make<IReportingPeriod>({
    type: EPeriodEvents.ReportingPeriodCreated,
    data: params,
  });
}

const periodEvents = Object.freeze({
  fiscalYearCreated: makeFiscalYearCreatedEvent,
  accountingPeriodCreated: makeAccountingPeriodCreatedEvent,
  reportingPeriodCreated: makeReportingPeriodCreatedEvent,
});

export default periodEvents;
