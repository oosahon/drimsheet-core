import IReportingPeriodHistoryRepo from '../../../../domain/accounting/repos/reporting-period-history.repo';
import repoError from '../../../../shared/values/errors/repo.error';
import { reportingPeriodHistoryInAudit } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import reportingPeriodHistoryMapper from '../../mappers/accounting/reporting-period-history.mapper';

const reportingPeriodHistoryRepo: IReportingPeriodHistoryRepo = {
  save: async (periods, histories, options) => {
    const periodsArray = Array.isArray(periods) ? periods : [periods];
    const historiesArray = Array.isArray(histories) ? histories : [histories];
    const historyByPeriodId = new Map(
      historiesArray.map((history) => [history.entityId, history])
    );

    const values = periodsArray.map((period) => {
      const history = historyByPeriodId.get(period.id);

      if (!history) {
        throw new repoError.MissingHistory({ periodId: period.id });
      }

      return reportingPeriodHistoryMapper.toRepo(period, history);
    });

    await getDbQuery(options)
      .insert(reportingPeriodHistoryInAudit)
      .values(values);
  },
};

export default reportingPeriodHistoryRepo;
