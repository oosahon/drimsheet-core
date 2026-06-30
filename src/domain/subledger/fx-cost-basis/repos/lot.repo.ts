import { IWriteRepoOptions } from '../../../../shared/types/repo.types';
import { IFxCostBasisLot, IFxCostBasisLotHistory } from '../types/lot.types';

export default interface IFxCostBasisLotRepo {
  create(
    payload: IFxCostBasisLot,
    options: IWriteRepoOptions<IFxCostBasisLotHistory>
  ): Promise<void>;
}
