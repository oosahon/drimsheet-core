import { eq } from 'drizzle-orm';
import exchangeRateMapper from '../../../app/mappers/exchange-rate.mapper';
import IExchangeRateRepo from '../../../domain/currency/repos/exchange-rate.repo';
import { exchangeRatesInCore } from '../drizzle/schema';
import getDbQuery from './helpers/query';

const exchangeRateRepo: IExchangeRateRepo = {
  save: async (payload, options) => {
    const dbQuery = getDbQuery(options);

    await dbQuery
      .insert(exchangeRatesInCore)
      .values(exchangeRateMapper.toRepo(payload));
  },

  getById: async (id, options) => {
    const dbQuery = getDbQuery(options);
    const [result] = await dbQuery
      .select()
      .from(exchangeRatesInCore)
      .where(eq(exchangeRatesInCore.id, BigInt(id)));

    return result ? exchangeRateMapper.toDomain(result) : null;
  },
};

export default exchangeRateRepo;
