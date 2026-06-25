import { IMoney } from '../../../../shared/types/money.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { IExchangeRate } from '../../../currency/types/exchange-rate.types';

export const EFxLotStatus = {
  Open: 'open',
  Closed: 'closed',
} as const;

export type UFxLotStatus = (typeof EFxLotStatus)[keyof typeof EFxLotStatus];

export interface IFxLot {
  id: TEntityId;
  ledgerAccountId: TEntityId;
  accountingEntityId: TEntityId;
  status: UFxLotStatus;
  originalQuantity: IMoney;
  remainingQuantity: IMoney;
  costBasis: IMoney;
  remainingCostBasis: IMoney;
  acquisitionRate: IExchangeRate;
  acquisitionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFxLotAcquisition {
  id: TEntityId;
  ledgerAccountId: TEntityId;
  accountingEntityId: TEntityId;
  lotId: TEntityId;
  journalEntryId: TEntityId;
  quantity: IMoney;
  costBasis: IMoney;
  acquisitionRate: IExchangeRate;
  officialRate: IExchangeRate | null;
  officialRateId: number | null;
  acquisitionDate: Date;
  createdAt: Date;
}

export interface IFxLotDisposition {
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
  officialRateId: number | null;
  dispositionDate: Date;
  createdAt: Date;
}

export interface IFxLotAllocation {
  id: TEntityId;
  dispositionId: TEntityId;
  lotId: TEntityId;
  quantity: IMoney;
  costBasisConsumed: IMoney;
  proceeds: IMoney;
  realizedGainLoss: IMoney;
  createdAt: Date;
}
