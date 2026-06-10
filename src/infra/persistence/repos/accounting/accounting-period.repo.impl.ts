import accountingPeriodMapper from '../../../../app/accounting/mappers/accounting-period.mapper';
import IAccountingPeriodRepo from '../../../../domain/accounting/repos/accounting-period.repo';
import { accountingPeriodsInCore } from '../../../config/drizzle/schema';
import getDbQuery from '../helpers/query';

const accountingPeriodRepoImpl: IAccountingPeriodRepo = {
  save: async (payload, options) => {
    const dbQuery = getDbQuery(options);

    const valuesArray = Array.isArray(payload)
      ? payload.map(accountingPeriodMapper.toRepo)
      : [accountingPeriodMapper.toRepo(payload)];

    await dbQuery.insert(accountingPeriodsInCore).values(valuesArray);
  },
};

export default accountingPeriodRepoImpl;
