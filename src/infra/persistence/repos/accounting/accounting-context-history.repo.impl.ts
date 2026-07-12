import IAccountingContextHistoryRepo from '../../../../domain/accounting/repos/accounting-context-history.repo';
import { accountingContextHistoryInAudit } from '../../../config/drizzle/schema';
import accountingContextHistoryMapper from '../../mappers/accounting/accounting-context-history.mapper';
import getDbQuery from '../helpers/query';

const accountingContextHistoryRepo: IAccountingContextHistoryRepo = {
  save: async (context, history, options) => {
    await getDbQuery(options)
      .insert(accountingContextHistoryInAudit)
      .values(accountingContextHistoryMapper.toRepo(context, history));
  },
};

export default accountingContextHistoryRepo;
