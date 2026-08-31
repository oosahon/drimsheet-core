import IFxCostBasisLotAcquisitionRepo from '@domain/subledger/fx-cost-basis/repos/acquisition.repo';

import {
  subledgerFxCostBasisLotAcquisitionHistoryInAudit,
  subledgerFxCostBasisLotAcquisitionsInCore,
} from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import fxCostBasisLotAcquisitionHistoryMapper from '@infra/persistence/repos/subledger/fx-cost-basis/mappers/acquisition-history.mapper';
import fxCostBasisLotAcquisitionMapper from '@infra/persistence/repos/subledger/fx-cost-basis/mappers/acquisition.mapper';

const fxCostBasisLotAcquisitionRepo: IFxCostBasisLotAcquisitionRepo = {
  create: async (payload, options) => {
    await getDbQuery(options).transaction(async (tx) => {
      const repoModel = fxCostBasisLotAcquisitionMapper.toRepo(payload);
      await tx
        .insert(subledgerFxCostBasisLotAcquisitionsInCore)
        .values(repoModel);

      const historyValues = Array.isArray(options.history)
        ? options.history
        : [options.history];
      await tx
        .insert(subledgerFxCostBasisLotAcquisitionHistoryInAudit)
        .values(
          historyValues.map(fxCostBasisLotAcquisitionHistoryMapper.toRepo)
        );
    });
  },
};

export default fxCostBasisLotAcquisitionRepo;
