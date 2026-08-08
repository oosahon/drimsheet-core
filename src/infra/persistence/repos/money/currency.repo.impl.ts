import { eq } from 'drizzle-orm';

import ICurrencyRepo from '@domain/money/repos/currency.repo';

import { currenciesInCore as currencies } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import currencyMapper from '@infra/persistence/repos/money/mappers/currency.mapper';

const currencyRepo: ICurrencyRepo = {
  create: async (payload, options) => {
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
