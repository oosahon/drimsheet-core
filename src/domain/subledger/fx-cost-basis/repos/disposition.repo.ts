import { IWriteRepoOptions } from '@shared/types/repo.types';

import {
  IFxCostBasisLotDisposition,
  IFxCostBasisLotDispositionHistory,
} from '@domain/subledger/fx-cost-basis/types/disposition.types';

export default interface IFxCostBasisLotDispositionRepo {
  create(
    payload: IFxCostBasisLotDisposition,
    options: IWriteRepoOptions<IFxCostBasisLotDispositionHistory>
  ): Promise<void>;
}
