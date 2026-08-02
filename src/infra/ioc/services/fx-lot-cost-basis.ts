import makeFxLotCostBasisPersistenceService from '../../../app/subledger/fx-cost-basis/services/fx-cost-basis-persistence.service';
import makeFxCostBasisLotService from '../../../domain/subledger/fx-cost-basis/services/lot.service';
import fxCostBasisLotAcquisitionRepo from '../../persistence/repos/subledger/fx-cost-basis/acquisition.repo.impl';
import fxCostBasisLotRepo from '../../persistence/repos/subledger/fx-cost-basis/lot.repo.impl';
import { repoService } from './repo';

export const fxCostBasisLotService = makeFxCostBasisLotService();

export const fxCostBasisPersistenceService =
  makeFxLotCostBasisPersistenceService({
    lotRepo: fxCostBasisLotRepo,
    acquisitionRepo: fxCostBasisLotAcquisitionRepo,
    repoService,
  });
