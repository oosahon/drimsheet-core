import IAccountingContextRepo from '../../../../domain/accounting/repos/accounting-context.repo';
import passOnRepoTransaction from '../../../../shared/helpers/passon-repo-transaction';
import { accountingContextsInCore } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import accountingContextHistoryRepo from './accounting-context-history.repo.impl';
import accountingContextMapper from './mappers/accounting-context.mapper';

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
