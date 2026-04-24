import { TEntityId } from '../../../shared/types/uuid';
import { ICurrency } from '../../currency/types/currency.types';
import { UAdjustmentType } from '../../ledger/types/ledger.types';

export interface ICurrencyLot {
  id: TEntityId;
  journalEntryId: TEntityId;
  accountId: TEntityId;
  amount: number;
  balance: number;
  currency: ICurrency;
  functionalCurrency: ICurrency;
  spotRate: number;
  adjustedFunctionalBalanceImpact: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICurrencyLotAdjustment {
  id: TEntityId;
  targetLotId: TEntityId;
  adjustmentType: UAdjustmentType;
  spotRate: number;
  newFunctionalBalanceImpact: number;
  balanceImpactDelta: number;
  postedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICurrencyLotSale {
  id: TEntityId;
  journalEntryId: TEntityId;
  targetLotId: TEntityId;
  spotRate: number;
  wacSpotRateAtSale: number;
  amount: number;
  fifoRealizedImpact: number;
  wacRealizedImpact: number;
  createdAt: Date;
  updatedAt: Date;
}
