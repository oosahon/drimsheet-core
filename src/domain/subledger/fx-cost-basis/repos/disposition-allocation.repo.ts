import { IWriteRepoOptions } from '@shared/types/repo.types';

import { IFxCostBasisLotDispositionAllocation } from '@domain/subledger/fx-cost-basis/types/disposition.types';

export default interface IFxCostBasisLotDispositionAllocationRepo {
  create(
    payload: IFxCostBasisLotDispositionAllocation,
    options: IWriteRepoOptions
  ): Promise<void>;
}
