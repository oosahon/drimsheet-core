import makeFxLotCostBasisPersistenceService from '../../app/subledger/fx-cost-basis/services/fx-cost-basis-persistence.service';
import makeFxCostBasisLotService from '../../domain/subledger/fx-cost-basis/services/lot.service';
import fxCostBasisLotAcquisitionRepo from '../persistence/repos/subledger/fx-cost-basis/acquisition.repo.impl';
import fxCostBasisLotRepo from '../persistence/repos/subledger/fx-cost-basis/lot.repo.impl';
import repoService from './repo.service';

const domain = makeFxCostBasisLotService();

const persistence = makeFxLotCostBasisPersistenceService(
  fxCostBasisLotRepo,
  fxCostBasisLotAcquisitionRepo,
  repoService
);

const fxCostBasisService = Object.freeze({
  persistence,
  domain,
});

export default fxCostBasisService;
