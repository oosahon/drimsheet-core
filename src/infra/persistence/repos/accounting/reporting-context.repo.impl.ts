import reportingContextMapper from '../../../../app/accounting/mappers/reporting-context.mapper';
import IReportingContextRepo from '../../../../domain/accounting/repos/reporting-context.repo';
import { reportingContextsInCore } from '../../../config/drizzle/schema';
import getDbQuery from '../helpers/query';

const reportingContextRepoImpl: IReportingContextRepo = {
  save: async (payload, options) => {
    const dbQuery = getDbQuery(options);

    await dbQuery
      .insert(reportingContextsInCore)
      .values(reportingContextMapper.toRepo(payload));
  },
};

export default reportingContextRepoImpl;
