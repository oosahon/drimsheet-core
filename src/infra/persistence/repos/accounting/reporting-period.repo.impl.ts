import reportingPeriodMapper from '../../../../app/accounting/mappers/reporting-period.mapper';
import IReportingPeriodRepo from '../../../../domain/accounting/repos/reporting-period.repo';
import { reportingPeriodsInCore } from '../../../config/drizzle/schema';
import passOnRepoTransaction from '../helpers/passon-repo-transaction';
import getDbQuery from '../helpers/query';
import reportingPeriodHistoryRepo from './reporting-period-history.repo.impl';

const reportingPeriodRepoImpl: IReportingPeriodRepo = {
  create: async (payload, options) => {
    await getDbQuery(options).transaction(async (tx) => {
      const valuesArray = Array.isArray(payload)
        ? payload.map(reportingPeriodMapper.toRepo)
        : [reportingPeriodMapper.toRepo(payload)];

      await tx.insert(reportingPeriodsInCore).values(valuesArray);

      await reportingPeriodHistoryRepo.save(
        payload,
        options.history,
        passOnRepoTransaction(options, tx)
      );
    });
  },
};

export default reportingPeriodRepoImpl;
