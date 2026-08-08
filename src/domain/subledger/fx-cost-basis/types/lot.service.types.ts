import { TCreationOmits } from '@shared/types/creation-omits.types';

import fxCostBasisLotAcquisitionEntity from '@domain/subledger/fx-cost-basis/entities/acquisition.entity';
import fxCostBasisLotEntity from '@domain/subledger/fx-cost-basis/entities/lot.entity';

import { IFxCostBasisLotAcquisition } from './acquisition.types';

export default interface IFxCostBasisLotDomainService {
  acquire(payload: TCreationOmits<IFxCostBasisLotAcquisition, 'lotId'>): {
    lot: ReturnType<typeof fxCostBasisLotEntity.make>;
    acquisition: ReturnType<typeof fxCostBasisLotAcquisitionEntity.make>;
  };
}
