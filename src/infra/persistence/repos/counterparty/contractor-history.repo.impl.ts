import IContractorHistoryRepo from '@domain/counterparty/repos/contractor-history.repo';

import { counterpartyContractorHistoryInAudit } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import contractorHistoryMapper from '@infra/persistence/repos/counterparty/mappers/contractor-history.mapper';

const contractorHistoryRepo: IContractorHistoryRepo = {
  save: async (history, options) => {
    await getDbQuery(options)
      .insert(counterpartyContractorHistoryInAudit)
      .values(contractorHistoryMapper.toRepo(history));
  },
};

export default contractorHistoryRepo;
