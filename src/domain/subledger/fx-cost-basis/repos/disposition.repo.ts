import { IWriteRepoOptions } from '@shared/types/repo.types';

import { IFxCostBasisLotDisposition } from '@domain/subledger/fx-cost-basis/types/disposition.types';

export default interface IFxCostBasisLotDispositionRepo {
  create(
    payload: IFxCostBasisLotDisposition,
    options: IWriteRepoOptions
  ): Promise<void>;
}
