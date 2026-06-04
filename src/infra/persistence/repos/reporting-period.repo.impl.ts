import reportingPeriodMapper from '../../../app/accounting/mappers/reporting-period.mapper';
import IReportingPeriodRepo from '../../../domain/accounting/repos/reporting-period.repo';
import { reportingPeriodsInCore } from '../../config/drizzle/schema';
import getDbQuery from './helpers/query';

const reportingPeriodRepoImpl: IReportingPeriodRepo = {
  save: async (payload, options) => {
    const dbQuery = getDbQuery(options);

    const valuesArray = Array.isArray(payload)
      ? payload.map(reportingPeriodMapper.toRepo)
      : [reportingPeriodMapper.toRepo(payload)];

    await dbQuery.insert(reportingPeriodsInCore).values(valuesArray);
  },
};

export default reportingPeriodRepoImpl;
