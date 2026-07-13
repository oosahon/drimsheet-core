import IFiscalYearHistoryRepo from '../../../../domain/accounting/repos/fiscal-year-history.repo';
import getDbQuery from '../../../../shared/helpers/get-db-query';
import { fiscalYearHistoryInAudit } from '../../../config/drizzle/schema';
import fiscalYearHistoryMapper from '../../mappers/accounting/fiscal-year-history.mapper';

const fiscalYearHistoryRepo: IFiscalYearHistoryRepo = {
  save: async (fiscalYear, history, options) => {
    await getDbQuery(options)
      .insert(fiscalYearHistoryInAudit)
      .values(fiscalYearHistoryMapper.toRepo(fiscalYear, history));
  },
};

export default fiscalYearHistoryRepo;
