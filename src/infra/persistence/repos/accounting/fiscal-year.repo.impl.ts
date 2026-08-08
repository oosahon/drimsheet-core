import passOnRepoTransaction from '@shared/helpers/passon-repo-transaction';

import IFiscalYearRepo from '@domain/accounting/repos/fiscal-year.repo';

import { fiscalYearsInCore } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import fiscalYearMapper from '@infra/persistence/repos/accounting/mappers/fiscal-year.mapper';

import fiscalYearHistoryRepo from './fiscal-year-history.repo.impl';

const fiscalYearRepoImpl: IFiscalYearRepo = {
  create: async (payload, options) => {
    await getDbQuery(options).transaction(async (tx) => {
      await tx
        .insert(fiscalYearsInCore)
        .values(fiscalYearMapper.toRepo(payload));

      await fiscalYearHistoryRepo.save(
        payload,
        options.history,
        passOnRepoTransaction(options, tx)
      );
    });
  },
};

export default fiscalYearRepoImpl;
