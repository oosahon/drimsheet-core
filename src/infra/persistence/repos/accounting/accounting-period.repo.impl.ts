import { and, eq, gte, lte } from 'drizzle-orm';
import IAccountingPeriodRepo from '../../../../domain/accounting/repos/accounting-period.repo';
import passOnRepoTransaction from '../../../../shared/helpers/passon-repo-transaction';
import { accountingPeriodsInCore } from '../../../config/drizzle/schema';
import { toRepoDateOnly } from '../../helpers/date.mapper';
import getDbQuery from '../../helpers/get-db-query';
import accountingPeriodHistoryRepo from './accounting-period-history.repo.impl';
import accountingPeriodMapper from './mappers/accounting-period.mapper';

const accountingPeriodRepoImpl: IAccountingPeriodRepo = {
  findByDate: async (accountingEntityId, date, options) => {
    const repoDate = toRepoDateOnly(date);
    const baseQuery = getDbQuery(options)
      .select()
      .from(accountingPeriodsInCore)
      .where(
        and(
          eq(accountingPeriodsInCore.accountingEntityId, accountingEntityId),
          lte(accountingPeriodsInCore.startDate, repoDate),
          gte(accountingPeriodsInCore.endDate, repoDate)
        )
      );
    const query = options.lock ? baseQuery.for(options.lock) : baseQuery;
    const [result] = await query;

    return result ? accountingPeriodMapper.toDomain(result) : null;
  },

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
