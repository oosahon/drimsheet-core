import IEmployerHistoryRepo from '@domain/counterparty/repos/employer-history.repo';

import { counterpartyEmployerHistoryInAudit } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import employerHistoryMapper from '@infra/persistence/repos/counterparty/mappers/employer-history.mapper';

const employerHistoryRepo: IEmployerHistoryRepo = {
  save: async (history, options) => {
    await getDbQuery(options)
      .insert(counterpartyEmployerHistoryInAudit)
      .values(employerHistoryMapper.toRepo(history));
  },
};

export default employerHistoryRepo;
