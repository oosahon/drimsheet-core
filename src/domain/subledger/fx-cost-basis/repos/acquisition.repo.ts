import { IWriteRepoOptions } from '@shared/types/repo.types';

import {
  IFxCostBasisLotAcquisition,
  IFxCostBasisLotAcquisitionHistory,
} from '@domain/subledger/fx-cost-basis/types/acquisition.types';

export default interface IFxCostBasisLotAcquisitionRepo {
  create(
    payload: IFxCostBasisLotAcquisition,
    options: IWriteRepoOptions<IFxCostBasisLotAcquisitionHistory>
  ): Promise<void>;
}
