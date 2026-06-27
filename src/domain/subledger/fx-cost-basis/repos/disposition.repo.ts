import { IWriteRepoOptions } from '../../../../shared/types/repo.types';
import { IFxCostBasisLotDisposition } from '../types/disposition.types';

export default interface IFxCostBasisLotDispositionRepo {
  create(
    payload: IFxCostBasisLotDisposition,
    options: IWriteRepoOptions
  ): Promise<void>;
}
