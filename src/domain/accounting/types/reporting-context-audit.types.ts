import {
  IEntityDelta,
  IHistory,
} from '../../../shared/history/types/history.types';
import { IReportingContext } from './context.types';

export const EReportingContextActions = {
  Created: 'created',
} as const;

export type UReportingContextActions =
  (typeof EReportingContextActions)[keyof typeof EReportingContextActions];

export interface IReportingContextAudit extends IEntityDelta<IReportingContext> {
  action: UReportingContextActions;
}

export interface IMakeReportingContextAuditPayload {
  before: IReportingContext | null;
  after: IReportingContext;
  action: UReportingContextActions;
}

export interface IReportingContextHistory extends IHistory<IReportingContext> {}
