import IAccountingPeriodHistoryRepo from '../../../../domain/accounting/repos/accounting-period-history.repo';
import repoError from '../../../../shared/values/errors/repo.error';
import { accountingPeriodHistoryInAudit } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import accountingPeriodHistoryMapper from './mappers/accounting-period-history.mapper';

const accountingPeriodHistoryRepo: IAccountingPeriodHistoryRepo = {
  save: async (payload, historyPayload, options) => {
    const periods = Array.isArray(payload) ? payload : [payload];
    const histories = Array.isArray(historyPayload)
      ? historyPayload
      : [historyPayload];
    const historyByPeriodId = new Map(
      histories.map((history) => [history.entityId, history])
    );

    const values = periods.map((period) => {
      const history = historyByPeriodId.get(period.id);

      if (!history) {
        throw new repoError.MissingHistory({ periodId: period.id });
      }

      return accountingPeriodHistoryMapper.toRepo(period, history);
    });

    await getDbQuery(options)
      .insert(accountingPeriodHistoryInAudit)
      .values(values);
  },
};

export default accountingPeriodHistoryRepo;
