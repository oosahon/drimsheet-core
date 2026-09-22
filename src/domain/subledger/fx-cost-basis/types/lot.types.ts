import { TEntityId } from '@shared/types/uuid';
import {
  IEntityDelta,
  IHistory,
} from '@shared/values/history/types/history.types';

import { IExchangeRate } from '@domain/money/types/exchange-rate.types';
import { IMoney } from '@domain/money/types/money.types';

export const EFxCostBasisLotStatus = {
  Open: 'open',
  Closed: 'closed',
} as const;

export type UFxCostBasisLotStatus =
  (typeof EFxCostBasisLotStatus)[keyof typeof EFxCostBasisLotStatus];

export interface IFxCostBasisLot {
  id: TEntityId;
  ledgerAccountId: TEntityId;
  accountingEntityId: TEntityId;
  status: UFxCostBasisLotStatus;
  originalQuantity: IMoney;
  remainingQuantity: IMoney;
  costBasis: IMoney;
  remainingCostBasis: IMoney;
  acquisitionRate: IExchangeRate;
  acquisitionDate: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export const EFxCostBasisLotAuditAction = {
  Created: 'created',
  Acquired: 'acquired',
  Disposed: 'disposed',
  Closed: 'closed',
  Reopened: 'reopened',
  Reversed: 'reversed',
} as const;

export type UFxCostBasisLotAuditAction =
  (typeof EFxCostBasisLotAuditAction)[keyof typeof EFxCostBasisLotAuditAction];

export interface IFxCostBasisLotAudit extends IEntityDelta<IFxCostBasisLot> {
  action: UFxCostBasisLotAuditAction;
}

export interface IMakeFxCostBasisLotAuditPayload {
  before: IFxCostBasisLot | null;
  after: IFxCostBasisLot;
  action: UFxCostBasisLotAuditAction;
}

export interface IFxCostBasisLotHistory extends IHistory<IFxCostBasisLot> {}
