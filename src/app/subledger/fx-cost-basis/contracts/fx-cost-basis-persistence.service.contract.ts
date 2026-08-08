import { IWriteRepoOptions } from '@shared/types/repo.types';

import {
  IFxCostBasisLotAcquisition,
  IFxCostBasisLotAcquisitionHistory,
} from '@domain/subledger/fx-cost-basis/types/acquisition.types';
import {
  IFxCostBasisLot,
  IFxCostBasisLotHistory,
} from '@domain/subledger/fx-cost-basis/types/lot.types';

export default interface IFxCostBasisPersistenceService {
  persistAcquisition(
    lot: IFxCostBasisLot,
    acquisition: IFxCostBasisLotAcquisition,
    lotHistory: IFxCostBasisLotHistory,
    acquisitionHistory: IFxCostBasisLotAcquisitionHistory,
    repoOptions: IWriteRepoOptions
  ): Promise<void>;
}
