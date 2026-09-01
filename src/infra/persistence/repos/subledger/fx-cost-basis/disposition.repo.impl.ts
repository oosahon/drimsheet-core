import IFxCostBasisLotDispositionRepo from '@domain/subledger/fx-cost-basis/repos/disposition.repo';

import {
  subledgerFxCostBasisLotDispositionHistoryInAudit,
  subledgerFxCostBasisLotDispositionsInCore,
} from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import fxCostBasisLotDispositionHistoryMapper from '@infra/persistence/repos/subledger/fx-cost-basis/mappers/disposition-history.mapper';
import fxCostBasisLotDispositionMapper from '@infra/persistence/repos/subledger/fx-cost-basis/mappers/disposition.mapper';

const fxCostBasisLotDispositionRepo: IFxCostBasisLotDispositionRepo = {
  create: async (payload, options) => {
    await getDbQuery(options).transaction(async (tx) => {
      const repoModel = fxCostBasisLotDispositionMapper.toRepo(payload);
      await tx
        .insert(subledgerFxCostBasisLotDispositionsInCore)
        .values(repoModel);

      await tx
        .insert(subledgerFxCostBasisLotDispositionHistoryInAudit)
        .values(fxCostBasisLotDispositionHistoryMapper.toRepo(options.history));
    });
  },
};

export default fxCostBasisLotDispositionRepo;
