import { IReadRepoOptions, IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import { IFxCostBasisLotDispositionAllocation } from '@domain/subledger/fx-cost-basis/types/disposition.types';

export default interface IFxCostBasisLotDispositionAllocationRepo {
  findAllByDispositionId(
    dispositionId: TEntityId,
    options: IReadRepoOptions
  ): Promise<IFxCostBasisLotDispositionAllocation[]>;

  create(
    payload: IFxCostBasisLotDispositionAllocation,
    options: IWriteRepoOptions
  ): Promise<void>;
}
