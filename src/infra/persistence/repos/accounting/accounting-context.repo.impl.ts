import IAccountingContextRepo from '../../../../domain/accounting/repos/accounting-context.repo';
import { accountingContextsInCore } from '../../../config/drizzle/schema';
import accountingContextMapper from '../../mappers/accounting/accounting-context.mapper';
import passOnRepoTransaction from '../helpers/passon-repo-transaction';
import getDbQuery from '../helpers/query';
import accountingContextHistoryRepo from './accounting-context-history.repo.impl';

const accountingContextRepoImpl: IAccountingContextRepo = {
  create: async (payload, options) => {
    await getDbQuery(options).transaction(async (tx) => {
      await tx
        .insert(accountingContextsInCore)
        .values(accountingContextMapper.toRepo(payload));

      await accountingContextHistoryRepo.save(
        payload,
        options.history,
        passOnRepoTransaction(options, tx)
      );
    });
  },
};

export default accountingContextRepoImpl;
