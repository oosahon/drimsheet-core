import { IJournalLine } from '../../../../domain/journal-entry/types/journal-line.types';
import { ILedgerAccount } from '../../../../domain/ledger/types/ledger.types';
import fxCostBasisLotAcquisitionEntity from '../../../../domain/subledger/fx-cost-basis/entities/acquisition.entity';
import fxCostBasisLotEntity from '../../../../domain/subledger/fx-cost-basis/entities/lot.entity';
import { IRepoOptions } from '../../../../shared/types/repo.types';

export default interface IFxCostBasisService {
  createAcquisition(
    journalLine: IJournalLine,
    ledgerAccount: ILedgerAccount,
    repoOptions: IRepoOptions
  ): {
    lot: ReturnType<typeof fxCostBasisLotEntity.make>;
    acquisition: ReturnType<typeof fxCostBasisLotAcquisitionEntity.make>;
  };
}
