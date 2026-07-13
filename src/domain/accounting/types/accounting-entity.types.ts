import { IHistory } from '../../../shared/history/types/history.types';
import { TEntityId } from '../../../shared/types/uuid';
import { UCurrencyCode } from '../../money/config/currencies.config';
import { UJurisdictionCode } from '../config/jurisdictions.config';

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
  functionalCurrencyCode: UCurrencyCode;
  jurisdictionCode: UJurisdictionCode;
  createdAt: Date;
  updatedAt: Date;
}

export const EAccountingEntityHistoryAction = {
  Created: 'created',
  Updated: 'updated',
} as const;

export type UAccountingEntityHistoryAction =
  (typeof EAccountingEntityHistoryAction)[keyof typeof EAccountingEntityHistoryAction];

export type IAccountingEntityHistory = IHistory<IAccountingEntity>;
