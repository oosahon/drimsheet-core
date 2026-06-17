import { IEntityDelta, IHistory } from '../../../shared/types/history.types';
import {
  EAccountingEntityHistoryAction,
  IAccountingEntity,
  UAccountingEntityHistoryAction,
} from './accounting-entity.types';

export const EAccountingEntityActions = EAccountingEntityHistoryAction;

export type UAccountingEntityActions = UAccountingEntityHistoryAction;

export interface IAccountingEntityAudit extends IEntityDelta<IAccountingEntity> {
  action: UAccountingEntityActions;
}

export interface IMakeAccountingEntityAuditPayload {
  before: IAccountingEntity | null;
  after: IAccountingEntity;
  action: UAccountingEntityActions;
}

export interface IAccountingEntityAuditHistory extends IHistory<IAccountingEntity> {}
