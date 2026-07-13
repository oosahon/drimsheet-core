import IAccountingEntityHistoryRepo from '../../../../domain/accounting/repos/accounting-entity-history.repo';
import getDbQuery from '../../../../shared/helpers/get-db-query';
import { accountingEntityHistoryInAudit } from '../../../config/drizzle/schema';
import accountingEntityHistoryMapper from '../../mappers/accounting/accounting-entity-history.mapper';

const accountingEntityHistoryRepo: IAccountingEntityHistoryRepo = {
  save: async (entity, history, options) => {
    await getDbQuery(options)
      .insert(accountingEntityHistoryInAudit)
      .values(accountingEntityHistoryMapper.toRepo(history));
  },
};

export default accountingEntityHistoryRepo;
