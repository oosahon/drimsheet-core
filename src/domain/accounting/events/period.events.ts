import eventValue from '../../../shared/value-objects/event.vo';
import { IFiscalYear } from '../types/fiscal-year.types';
import { IAccountingPeriod, IReportingPeriod } from '../types/period.types';

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
