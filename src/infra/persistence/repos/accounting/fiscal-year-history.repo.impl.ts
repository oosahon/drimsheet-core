import fiscalYearHistoryMapper from '../../../../app/accounting/mappers/fiscal-year-history.mapper';
import IFiscalYearHistoryRepo from '../../../../domain/accounting/repos/fiscal-year-history.repo';
import { fiscalYearHistoryInAudit } from '../../../config/drizzle/schema';
import getDbQuery from '../helpers/query';

const fiscalYearHistoryRepo: IFiscalYearHistoryRepo = {
  save: async (fiscalYear, history, options) => {
    await getDbQuery(options)
      .insert(fiscalYearHistoryInAudit)
      .values(fiscalYearHistoryMapper.toRepo(fiscalYear, history));
  },
};

export default fiscalYearHistoryRepo;
