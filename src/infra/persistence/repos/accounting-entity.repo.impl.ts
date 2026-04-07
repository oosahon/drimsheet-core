import IAccountingEntityRepo from '../../../domain/accounting/repos/accounting-entity.repo';
import { accountingEntitiesInCore, currenciesInCore } from '../drizzle/schema';
import accountingEntityMapper from '../../../app/mappers/accounting-entity.mapper';
import getDbQuery from './helpers/query';
import { eq, getTableColumns } from 'drizzle-orm';

const accountingEntityRepo: IAccountingEntityRepo = {
  save: async (domain, options) => {
    const query = getDbQuery(options);

    await query
      .insert(accountingEntitiesInCore)
      .values(accountingEntityMapper.toRepo(domain));
  },

  findById: async (id, options) => {
    const query = getDbQuery(options);

    const [result] = await query
      .select({
        ...getTableColumns(accountingEntitiesInCore),
        functionalCurrency: getTableColumns(currenciesInCore),
        reportingCurrency: getTableColumns(currenciesInCore),
      })
      .from(accountingEntitiesInCore)
      .innerJoin(
        currenciesInCore,
        eq(
          accountingEntitiesInCore.functionalCurrencyCode,
          currenciesInCore.code
        )
      )
      .where(eq(accountingEntitiesInCore.id, id));

    return accountingEntityMapper.toDomain(result);
  },
};

export default accountingEntityRepo;
