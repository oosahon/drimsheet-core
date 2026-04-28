import { IAuditTrail } from '../../../shared/types/audit-trail.types';
import { TEntityId } from '../../../shared/types/uuid';
import { UCurrencyCode } from '../../currency/config/currencies.config';
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

export const EAccountingEntityAuditTrailAction = {
  Created: 'created',
  Updated: 'updated',
} as const;

export type UAccountingEntityAuditTrailAction =
  (typeof EAccountingEntityAuditTrailAction)[keyof typeof EAccountingEntityAuditTrailAction];

export interface IAccountingEntityAuditTrail extends IAuditTrail<IAccountingEntity> {
  accountingEntityId: TEntityId;
  action: UAccountingEntityAuditTrailAction;
}
