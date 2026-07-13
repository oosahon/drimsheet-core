import IAccountingEntityHistoryRepo from '../../../../domain/accounting/repos/accounting-entity-history.repo';
import { accountingEntityHistoryInAudit } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import accountingEntityHistoryMapper from '../../mappers/accounting/accounting-entity-history.mapper';

const accountingEntityHistoryRepo: IAccountingEntityHistoryRepo = {
  save: async (entity, history, options) => {
    await getDbQuery(options)
      .insert(accountingEntityHistoryInAudit)
      .values(accountingEntityHistoryMapper.toRepo(history));
  },
};

export default accountingEntityHistoryRepo;
