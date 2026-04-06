import IAccountingEntityRepo from '../../../domain/accounting/repos/accounting-entity.repo';
import { accountingEntitiesInCore } from '../drizzle/schema';
import accountingEntityMapper from '../../../app/mappers/accounting-entity.mapper';
import getDbQuery from './helpers/query';

const accountingEntityRepo: IAccountingEntityRepo = {
  save: async (domain, options) => {
    const query = getDbQuery(options);

    await query
      .insert(accountingEntitiesInCore)
      .values(accountingEntityMapper.toRepo(domain));
  },
};

export default accountingEntityRepo;
