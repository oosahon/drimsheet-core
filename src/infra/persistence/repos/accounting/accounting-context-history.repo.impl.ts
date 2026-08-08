import IAccountingContextHistoryRepo from '@domain/accounting/repos/accounting-context-history.repo';

import { accountingContextHistoryInAudit } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import accountingContextHistoryMapper from '@infra/persistence/repos/accounting/mappers/accounting-context-history.mapper';

const accountingContextHistoryRepo: IAccountingContextHistoryRepo = {
  save: async (context, history, options) => {
    await getDbQuery(options)
      .insert(accountingContextHistoryInAudit)
      .values(accountingContextHistoryMapper.toRepo(context, history));
  },
};

export default accountingContextHistoryRepo;
