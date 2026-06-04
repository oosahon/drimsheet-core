import fiscalYearMapper from '../../../app/accounting/mappers/fiscal-year.mapper';
import IFiscalYearRepo from '../../../domain/accounting/repos/fiscal-year.repo';
import { fiscalYearsInCore } from '../../config/drizzle/schema';
import getDbQuery from './helpers/query';

const fiscalYearRepoImpl: IFiscalYearRepo = {
  save: async (payload, options) => {
    const dbQuery = getDbQuery(options);

    await dbQuery
      .insert(fiscalYearsInCore)
      .values(fiscalYearMapper.toRepo(payload));
  },
};

export default fiscalYearRepoImpl;
