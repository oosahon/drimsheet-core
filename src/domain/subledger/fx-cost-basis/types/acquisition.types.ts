import { TEntityId } from '@shared/types/uuid';
import {
  IEntityDelta,
  IHistory,
} from '@shared/values/history/types/history.types';

import { IExchangeRate } from '@domain/money/types/exchange-rate.types';
import { IMoney } from '@domain/money/types/money.types';

export interface IFxCostBasisLotAcquisition {
  id: TEntityId;
  ledgerAccountId: TEntityId;
  accountingEntityId: TEntityId;
  lotId: TEntityId;
  journalEntryId: TEntityId;
  quantity: IMoney;
  costBasis: IMoney;
  acquisitionRate: IExchangeRate;
  acquisitionDate: Date;
  officialRate: IExchangeRate | null;
  createdAt: Date;
}

export const EFxCostBasisLotAcquisitionAuditAction = {
  Created: 'created',
} as const;

export type UFxCostBasisLotAcquisitionAuditAction =
  (typeof EFxCostBasisLotAcquisitionAuditAction)[keyof typeof EFxCostBasisLotAcquisitionAuditAction];

export interface IFxCostBasisLotAcquisitionAudit extends IEntityDelta<IFxCostBasisLotAcquisition> {
  action: UFxCostBasisLotAcquisitionAuditAction;
}

export interface IFxCostBasisLotAcquisitionHistory extends IHistory<IFxCostBasisLotAcquisition> {}
