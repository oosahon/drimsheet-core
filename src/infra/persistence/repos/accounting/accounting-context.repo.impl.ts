import accountingContextHistoryMapper from '../../../../app/accounting/mappers/accounting-context-history.mapper';
import accountingContextMapper from '../../../../app/accounting/mappers/accounting-context.mapper';
import IAccountingContextRepo from '../../../../domain/accounting/repos/accounting-context.repo';
import {
  accountingContextHistoryInAudit,
  accountingContextsInCore,
} from '../../../config/drizzle/schema';
import getDbQuery from '../helpers/query';

const accountingContextRepoImpl: IAccountingContextRepo = {
  save: async (payload, options) => {
    const dbQuery = getDbQuery(options);

    await dbQuery.transaction(async (tx) => {
      await tx
        .insert(accountingContextsInCore)
        .values(accountingContextMapper.toRepo(payload));

      await tx
        .insert(accountingContextHistoryInAudit)
        .values(
          accountingContextHistoryMapper.toRepo(payload, options.history)
        );
    });
  },
};

export default accountingContextRepoImpl;
