import {
  IEntityDelta,
  IHistory,
} from '../../../shared/history/types/history.types';
import { IFiscalYear } from './fiscal-year.types';
import {
  EPeriodHistoryAction,
  IAccountingPeriod,
  IReportingPeriod,
  UPeriodHistoryAction,
} from './period.types';

export const EPeriodActions = EPeriodHistoryAction;

export type UPeriodActions = UPeriodHistoryAction;

export interface IPeriodAudit<T extends object> extends IEntityDelta<T> {
  action: UPeriodActions;
}

export interface IMakePeriodAuditPayload<T extends object> {
  before: T | null;
  after: T;
  action: UPeriodActions;
}

export type IFiscalYearAudit = IPeriodAudit<IFiscalYear>;
export type IAccountingPeriodAudit = IPeriodAudit<IAccountingPeriod>;
export type IReportingPeriodAudit = IPeriodAudit<IReportingPeriod>;

export type IFiscalYearHistory = IHistory<IFiscalYear>;
export type IAccountingPeriodHistory = IHistory<IAccountingPeriod>;
export type IReportingPeriodHistory = IHistory<IReportingPeriod>;
