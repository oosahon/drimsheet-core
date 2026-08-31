import IFxCostBasisLotDispositionAllocationRepo from '@domain/subledger/fx-cost-basis/repos/disposition-allocation.repo';

import { subledgerFxCostBasisLotDispositionAllocationsInCore } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import fxCostBasisLotDispositionAllocationMapper from '@infra/persistence/repos/subledger/fx-cost-basis/mappers/disposition-allocation.mapper';

const fxCostBasisLotDispositionAllocationRepo: IFxCostBasisLotDispositionAllocationRepo =
  {
    create: async (payload, options) => {
      const repoModel =
        fxCostBasisLotDispositionAllocationMapper.toRepo(payload);
      await getDbQuery(options)
        .insert(subledgerFxCostBasisLotDispositionAllocationsInCore)
        .values(repoModel);
    },
  };

export default fxCostBasisLotDispositionAllocationRepo;
