import IAccountingContextHistoryRepo from '../../../../domain/accounting/repos/accounting-context-history.repo';
import getDbQuery from '../../../../shared/helpers/get-db-query';
import { accountingContextHistoryInAudit } from '../../../config/drizzle/schema';
import accountingContextHistoryMapper from '../../mappers/accounting/accounting-context-history.mapper';

const accountingContextHistoryRepo: IAccountingContextHistoryRepo = {
  save: async (context, history, options) => {
    await getDbQuery(options)
      .insert(accountingContextHistoryInAudit)
      .values(accountingContextHistoryMapper.toRepo(context, history));
  },
};

export default accountingContextHistoryRepo;
