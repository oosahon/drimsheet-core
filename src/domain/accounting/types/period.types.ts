import { IDiff } from '../../../shared/types/diff.types';
import { TEntityId } from '../../../shared/types/uuid';

/**
 * ================== Reusable Period Types ==================
 */
export const EPeriodUnit = {
  Day: 'day',
  Week: 'week',
  Month: 'month',
  Quarter: 'quarter',
  Year: 'year',
} as const;

export type UPeriodUnit = (typeof EPeriodUnit)[keyof typeof EPeriodUnit];

export interface IPeriod {
  id: TEntityId;
  name: string;
  accountingEntityId: TEntityId;
  unit: UPeriodUnit;
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

export const EPeriodStatus = {
  Pending: 'pending',
  Open: 'open',
  Closing: 'closing',
  Closed: 'closed',
} as const;

export type UPeriodStatus = (typeof EPeriodStatus)[keyof typeof EPeriodStatus];

/**
 * ================== Accounting Period ==================
 */
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
  updatedAt: Date;
}
