import IAccountingContextHistoryRepo from '../../../../domain/accounting/repos/accounting-context-history.repo';
import { accountingContextHistoryInAudit } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import accountingContextHistoryMapper from '../../mappers/accounting/accounting-context-history.mapper';

const accountingContextHistoryRepo: IAccountingContextHistoryRepo = {
  save: async (context, history, options) => {
    await getDbQuery(options)
      .insert(accountingContextHistoryInAudit)
      .values(accountingContextHistoryMapper.toRepo(context, history));
  },
};

export default accountingContextHistoryRepo;
