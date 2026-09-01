import { TEntityId } from '@shared/types/uuid';
import {
  IEntityDelta,
  IHistory,
} from '@shared/values/history/types/history.types';

import { IExchangeRate } from '@domain/money/types/exchange-rate.types';
import { IMoney } from '@domain/money/types/money.types';

export interface IFxCostBasisLotDisposition {
  id: TEntityId;
  ledgerAccountId: TEntityId;
  accountingEntityId: TEntityId;
  journalEntryId: TEntityId;
  quantity: IMoney;
  costBasisConsumed: IMoney;
  proceeds: IMoney;
  realizedGainLoss: IMoney;
  dispositionRate: IExchangeRate;
  officialRate: IExchangeRate | null;
  dispositionDate: Date;
  createdAt: Date;
}

export interface IFxCostBasisLotDispositionAllocation {
  id: TEntityId;
  dispositionId: TEntityId;
  lotId: TEntityId;
  quantity: IMoney;
  costBasisConsumed: IMoney;
  proceeds: IMoney;
  realizedGainLoss: IMoney;
  createdAt: Date;
}

export const EFxCostBasisLotDispositionAuditAction = {
  Created: 'created',
} as const;

export type UFxCostBasisLotDispositionAuditAction =
  (typeof EFxCostBasisLotDispositionAuditAction)[keyof typeof EFxCostBasisLotDispositionAuditAction];

export interface IFxCostBasisLotDispositionAudit extends IEntityDelta<IFxCostBasisLotDisposition> {
  action: UFxCostBasisLotDispositionAuditAction;
}

export interface IMakeFxCostBasisLotDispositionAuditPayload {
  before: IFxCostBasisLotDisposition | null;
  after: IFxCostBasisLotDisposition;
  action: UFxCostBasisLotDispositionAuditAction;
}

export interface IFxCostBasisLotDispositionHistory extends IHistory<IFxCostBasisLotDisposition> {}
