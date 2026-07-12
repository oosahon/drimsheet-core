import IReportingPeriodHistoryRepo from '../../../../domain/accounting/repos/reporting-period-history.repo';
import { reportingPeriodHistoryInAudit } from '../../../config/drizzle/schema';
import reportingPeriodHistoryMapper from '../../mappers/accounting/reporting-period-history.mapper';
import getDbQuery from '../helpers/query';

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
        throw new Error(`Missing history for reporting period ${period.id}`);
      }

      return reportingPeriodHistoryMapper.toRepo(period, history);
    });

    await getDbQuery(options)
      .insert(reportingPeriodHistoryInAudit)
      .values(values);
  },
};

export default reportingPeriodHistoryRepo;
