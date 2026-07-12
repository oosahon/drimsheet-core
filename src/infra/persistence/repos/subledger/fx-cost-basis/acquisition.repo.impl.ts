import IFxCostBasisLotAcquisitionRepo from '../../../../../domain/subledger/fx-cost-basis/repos/acquisition.repo';
import {
  subledgerFxCostBasisLotAcquisitionHistoryInAudit,
  subledgerFxCostBasisLotAcquisitionsInCore,
} from '../../../../config/drizzle/schema';
import fxCostBasisLotAcquisitionHistoryMapper from '../../../mappers/subledger/fx-cost-basis/acquisition-history.mapper';
import fxCostBasisLotAcquisitionMapper from '../../../mappers/subledger/fx-cost-basis/acquisition.mapper';
import getDbQuery from '../../helpers/query';

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
