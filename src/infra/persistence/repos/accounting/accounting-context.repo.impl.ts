import passOnRepoTransaction from '@shared/helpers/passon-repo-transaction';

import IAccountingContextRepo from '@domain/accounting/repos/accounting-context.repo';

import { accountingContextsInCore } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import accountingContextMapper from '@infra/persistence/repos/accounting/mappers/accounting-context.mapper';

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
