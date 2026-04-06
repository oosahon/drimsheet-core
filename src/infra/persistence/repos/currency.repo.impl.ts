import { eq } from 'drizzle-orm';
import ICurrencyRepo from '../../../domain/currency/repos/currency.repo';
import { currenciesInCore as currencies } from '../drizzle/schema';
import currencyMapper from '../../../app/mappers/currency.mapper';
import getDbQuery from './helpers/query';

const currencyRepo: ICurrencyRepo = {
  save: async (payload, options) => {
    const dbQuery = getDbQuery(options);

    await dbQuery
      .insert(currencies)
      .values(currencyMapper.toRepo(payload))
      .onConflictDoNothing();
  },

  findByCode: async (code, options) => {
    const dbQuery = getDbQuery(options);

    const [currency] = await dbQuery
      .select()
      .from(currencies)
      .where(eq(currencies.code, code));

    return currencyMapper.toDomain(currency);
  },

  findAll: async (options) => {
    const dbQuery = getDbQuery(options);

    const allCurrencies = await dbQuery.select().from(currencies);
    return allCurrencies.map(currencyMapper.toDomain);
  },
};

export default currencyRepo;
