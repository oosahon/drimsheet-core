import { IReadRepoOptions } from '@shared/types/repo.types';

import { IJournalEntry } from '@domain/journal-entry/types/journal-entry.types';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';
import { IExchangeRate } from '@domain/money/types/exchange-rate.types';
import fxCostBasisLotAcquisitionEntity from '@domain/subledger/fx-cost-basis/entities/acquisition.entity';
import fxCostBasisLotDispositionEntity from '@domain/subledger/fx-cost-basis/entities/disposition.entity';
import fxCostBasisLotEntity from '@domain/subledger/fx-cost-basis/entities/lot.entity';

import { IFxCostBasisLotDispositionAllocation } from './disposition.types';

export interface IFxCostBasisLotOperationPayload {
  journalEntry: IJournalEntry;
  account: ILedgerAccount;
  officialRate: IExchangeRate | null;
}

interface IFxCostBasisAcquisitionResult {
  lot: ReturnType<typeof fxCostBasisLotEntity.make>;
  acquisition: ReturnType<typeof fxCostBasisLotAcquisitionEntity.make>;
}

export interface IFxCostBasisDispositionResult {
  lots: ReturnType<typeof fxCostBasisLotEntity.consume>[];
  disposition: ReturnType<typeof fxCostBasisLotDispositionEntity.make>;
  allocations: IFxCostBasisLotDispositionAllocation[];
}

export default interface IFxCostBasisLotDomainService {
  acquire(
    payload: IFxCostBasisLotOperationPayload
  ): IFxCostBasisAcquisitionResult | null;

  dispose(
    payload: IFxCostBasisLotOperationPayload,
    repoOptions: IReadRepoOptions
  ): Promise<IFxCostBasisDispositionResult | null>;
}
