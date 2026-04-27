import { IDiff } from '../../../shared/types/diff.types';
import { TEntityId } from '../../../shared/types/uuid';

export const EAccountingEntityType = {
  Individual: 'individual',
  SoleTrader: 'sole_trader',
  PrivateCompany: 'private_company',
} as const;

export type UAccountingEntityType =
  (typeof EAccountingEntityType)[keyof typeof EAccountingEntityType];

export interface IAccountingEntity {
  id: TEntityId;
  name: string;
  type: UAccountingEntityType;
  ownerId: TEntityId;
  createdAt: Date;
  updatedAt: Date;
}

export const EAccountingEntityHistoryAction = {
  Created: 'created',
  Updated: 'updated',
} as const;

export type UAccountingEntityHistoryAction =
  (typeof EAccountingEntityHistoryAction)[keyof typeof EAccountingEntityHistoryAction];

export interface IAccountingEntityHistory {
  id: TEntityId;
  accountingEntityId: TEntityId;
  userId: TEntityId;
  action: UAccountingEntityHistoryAction;
  diff: IDiff<IAccountingEntity>;
  createdAt: Date;
}
