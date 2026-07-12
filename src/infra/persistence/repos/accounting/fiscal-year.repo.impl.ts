import IFiscalYearRepo from '../../../../domain/accounting/repos/fiscal-year.repo';
import { fiscalYearsInCore } from '../../../config/drizzle/schema';
import fiscalYearMapper from '../../mappers/accounting/fiscal-year.mapper';
import passOnRepoTransaction from '../helpers/passon-repo-transaction';
import getDbQuery from '../helpers/query';
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
