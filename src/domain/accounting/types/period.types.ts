import { IDiff } from '../../../shared/types/diff.types';
import { TEntityId } from '../../../shared/types/uuid';

/**
 * ================== Reusable Period Types ==================
 */
export const EPeriodMeasurement = {
  Day: 'day',
  Week: 'week',
  Month: 'month',
  Quarter: 'quarter',
  HalfYear: 'half_year',
  Year: 'year',
} as const;

export type UPeriodMeasurement =
  (typeof EPeriodMeasurement)[keyof typeof EPeriodMeasurement];

export interface IPeriod {
  id: TEntityId;
  accountingEntityId: TEntityId;
  measurement: UPeriodMeasurement;
  count: number;
  startDate: Date;
  endDate: Date;
}

export const EPeriodHistoryAction = {
  Created: 'created',
  Opened: 'opened',
  Edited: 'edited',
  Closed: 'closed',
  Reopened: 'reopened',
} as const;

export type UPeriodHistoryAction =
  (typeof EPeriodHistoryAction)[keyof typeof EPeriodHistoryAction];

export interface IPeriodHistory<T extends IPeriod> {
  id: TEntityId;
  periodId: TEntityId;
  action: UPeriodHistoryAction;
  userId: TEntityId;
  diff: IDiff<T>;
  createdAt: Date;
}

/**
 * ================== Accounting Period ==================
 */
export const EPeriodStatus = {
  Pending: 'pending',
  Open: 'open',
  Closing: 'closing',
  Closed: 'closed',
} as const;

export type UPeriodStatus = (typeof EPeriodStatus)[keyof typeof EPeriodStatus];

export interface IAccountingPeriod extends IPeriod {
  status: UPeriodStatus;
  fiscalYearId: TEntityId;
  closedAt: Date | null;
  updatedAt: Date;
}

/**
 * ================== Reporting Period ==================
 */
export interface IReportingPeriod extends IPeriod {
  fiscalYearId: TEntityId;
}

/**
 * ================== Fiscal Year ==================
 */
export interface IFiscalYear extends IPeriod {
  measurement: typeof EPeriodMeasurement.Month;
  status: UPeriodStatus;
  closedAt: Date | null;
  updatedAt: Date;
}
