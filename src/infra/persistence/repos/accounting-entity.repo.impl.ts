import { and, eq, getTableColumns } from 'drizzle-orm';
import accountingEntityMapper from '../../../app/mappers/accounting-entity.mapper';
import IAccountingEntityRepo from '../../../domain/accounting-entity/repos/accounting-entity.repo';
import {
  accountingEntitiesInCore,
  currenciesInCore,
} from '../../config/drizzle/schema';
import getDbQuery from './helpers/query';

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

  findByUserId: async (userId, options, type) => {
    const query = getDbQuery(options);

    const whereClause = [eq(accountingEntitiesInCore.ownerId, userId)];

    if (type) {
      whereClause.push(eq(accountingEntitiesInCore.type, type));
    }

    const results = await query
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
      .where(and(...whereClause));

    return results.map(accountingEntityMapper.toDomain);
  },
};

export default accountingEntityRepo;
