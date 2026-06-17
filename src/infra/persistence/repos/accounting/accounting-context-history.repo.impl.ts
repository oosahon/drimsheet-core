import accountingContextHistoryMapper from '../../../../app/accounting/mappers/accounting-context-history.mapper';
import IAccountingContextHistoryRepo from '../../../../domain/accounting/repos/accounting-context-history.repo';
import { accountingContextHistoryInAudit } from '../../../config/drizzle/schema';
import getDbQuery from '../helpers/query';

const accountingContextHistoryRepo: IAccountingContextHistoryRepo = {
  save: async (context, history, options) => {
    await getDbQuery(options)
      .insert(accountingContextHistoryInAudit)
      .values(accountingContextHistoryMapper.toRepo(context, history));
  },
};

export default accountingContextHistoryRepo;
