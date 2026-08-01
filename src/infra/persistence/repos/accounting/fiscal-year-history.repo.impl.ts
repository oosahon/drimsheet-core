import IFiscalYearHistoryRepo from '../../../../domain/accounting/repos/fiscal-year-history.repo';
import { fiscalYearHistoryInAudit } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import fiscalYearHistoryMapper from './mappers/fiscal-year-history.mapper';

const fiscalYearHistoryRepo: IFiscalYearHistoryRepo = {
  save: async (fiscalYear, history, options) => {
    await getDbQuery(options)
      .insert(fiscalYearHistoryInAudit)
      .values(fiscalYearHistoryMapper.toRepo(fiscalYear, history));
  },
};

export default fiscalYearHistoryRepo;
