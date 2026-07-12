import IAccountingEntityHistoryRepo from '../../../../domain/accounting/repos/accounting-entity-history.repo';
import { accountingEntityHistoryInAudit } from '../../../config/drizzle/schema';
import accountingEntityHistoryMapper from '../../mappers/accounting/accounting-entity-history.mapper';
import getDbQuery from '../helpers/query';

const accountingEntityHistoryRepo: IAccountingEntityHistoryRepo = {
  save: async (entity, history, options) => {
    await getDbQuery(options)
      .insert(accountingEntityHistoryInAudit)
      .values(accountingEntityHistoryMapper.toRepo(history));
  },
};

export default accountingEntityHistoryRepo;
