import accountingPeriodMapper from '../../../../app/accounting/mappers/accounting-period.mapper';
import IAccountingPeriodRepo from '../../../../domain/accounting/repos/accounting-period.repo';
import { accountingPeriodsInCore } from '../../../config/drizzle/schema';
import passOnRepoTransaction from '../helpers/passon-repo-transaction';
import getDbQuery from '../helpers/query';
import accountingPeriodHistoryRepo from './accounting-period-history.repo.impl';

const accountingPeriodRepoImpl: IAccountingPeriodRepo = {
  create: async (payload, options) => {
    await getDbQuery(options).transaction(async (tx) => {
      const valuesArray = Array.isArray(payload)
        ? payload.map(accountingPeriodMapper.toRepo)
        : [accountingPeriodMapper.toRepo(payload)];

      await tx.insert(accountingPeriodsInCore).values(valuesArray);

      await accountingPeriodHistoryRepo.save(
        payload,
        options.history,
        passOnRepoTransaction(options, tx)
      );
    });
  },
};

export default accountingPeriodRepoImpl;
