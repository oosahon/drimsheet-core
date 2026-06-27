import { IWriteRepoOptions } from '../../../../shared/types/repo.types';
import { IFxCostBasisLot, IFxCostBasisLotHistory } from '../types/lot.types';

export default interface IFxCostBasisLotRepo {
  create(
    payload: IFxCostBasisLot,
    options: IWriteRepoOptions<IFxCostBasisLotHistory>
  ): Promise<void>;

  update(
    payload: IFxCostBasisLot | IFxCostBasisLot[],
    options: IWriteRepoOptions<
      IFxCostBasisLotHistory | IFxCostBasisLotHistory[]
    >
  ): Promise<void>;
}
