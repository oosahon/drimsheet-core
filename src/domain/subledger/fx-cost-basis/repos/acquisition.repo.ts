import { IWriteRepoOptions } from '../../../../shared/types/repo.types';
import {
  IFxCostBasisLotAcquisition,
  IFxCostBasisLotAcquisitionHistory,
} from '../types/acquisition.types';

export default interface IFxCostBasisLotAcquisitionRepo {
  create(
    payload: IFxCostBasisLotAcquisition,
    options: IWriteRepoOptions<IFxCostBasisLotAcquisitionHistory>
  ): Promise<void>;
}
