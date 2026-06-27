import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import fxCostBasisLotAcquisitionEntity from '../entities/acquisition.entity';
import fxCostBasisLotEntity from '../entities/lot.entity';
import { IFxCostBasisLotAcquisition } from './acquisition.types';

export default interface IFxCostBasisLotAcquisitionService {
  create(payload: TCreationOmits<IFxCostBasisLotAcquisition, 'lotId'>): {
    lot: ReturnType<typeof fxCostBasisLotEntity.make>;
    acquisition: ReturnType<typeof fxCostBasisLotAcquisitionEntity.make>;
  };
}
