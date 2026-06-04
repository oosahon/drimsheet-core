import accountingContextMapper from '../../../app/accounting/mappers/accounting-context.mapper';
import IAccountingContextRepo from '../../../domain/accounting/repos/accounting-context.repo';
import { accountingContextsInCore } from '../../config/drizzle/schema';
import getDbQuery from './helpers/query';

const accountingContextRepoImpl: IAccountingContextRepo = {
  save: async (payload, options) => {
    const dbQuery = getDbQuery(options);

    await dbQuery
      .insert(accountingContextsInCore)
      .values(accountingContextMapper.toRepo(payload));
  },
};

export default accountingContextRepoImpl;
