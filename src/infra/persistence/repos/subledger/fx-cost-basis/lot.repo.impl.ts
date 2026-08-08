import IFxCostBasisLotRepo from '@domain/subledger/fx-cost-basis/repos/lot.repo';

import {
  subledgerFxCostBasisLotHistoryInAudit,
  subledgerFxCostBasisLotsInCore,
} from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import fxCostBasisLotHistoryMapper from '@infra/persistence/repos/subledger/mappers/fx-cost-basis/lot-history.mapper';
import fxCostBasisLotMapper from '@infra/persistence/repos/subledger/mappers/fx-cost-basis/lot.mapper';

const fxCostBasisLotRepo: IFxCostBasisLotRepo = {
  create: async (payload, options) => {
    await getDbQuery(options).transaction(async (tx) => {
      const repoModel = fxCostBasisLotMapper.toRepo(payload);
      await tx.insert(subledgerFxCostBasisLotsInCore).values(repoModel);

      const historyValues = Array.isArray(options.history)
        ? options.history
        : [options.history];
      await tx
        .insert(subledgerFxCostBasisLotHistoryInAudit)
        .values(historyValues.map(fxCostBasisLotHistoryMapper.toRepo));
    });
  },
};

export default fxCostBasisLotRepo;
