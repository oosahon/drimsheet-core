import { IEntityDelta, IHistory } from '../../../../shared/types/history.types';
import { IMoney } from '../../../../shared/types/money.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { IExchangeRate } from '../../../currency/types/exchange-rate.types';

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
