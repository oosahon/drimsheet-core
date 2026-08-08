import IAccountingEntityHistoryRepo from '@domain/accounting/repos/accounting-entity-history.repo';

import { accountingEntityHistoryInAudit } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import accountingEntityHistoryMapper from '@infra/persistence/repos/accounting/mappers/accounting-entity-history.mapper';

const accountingEntityHistoryRepo: IAccountingEntityHistoryRepo = {
  save: async (entity, history, options) => {
    await getDbQuery(options)
      .insert(accountingEntityHistoryInAudit)
      .values(accountingEntityHistoryMapper.toRepo(history));
  },
};

export default accountingEntityHistoryRepo;
