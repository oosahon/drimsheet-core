import { eq } from 'drizzle-orm';
import exchangeRateMapper from '../../../app/currency/mappers/exchange-rate.mapper';
import IExchangeRateRepo from '../../../domain/currency/repos/exchange-rate.repo';
import { currencyExchangeRatesInCore } from '../../config/drizzle/schema';
import getDbQuery from './helpers/query';

const exchangeRateRepo: IExchangeRateRepo = {
  save: async (payload, options) => {
    const dbQuery = getDbQuery(options);

    await dbQuery
      .insert(currencyExchangeRatesInCore)
      .values(exchangeRateMapper.toRepo(payload));
  },

  getById: async (id, options) => {
    const dbQuery = getDbQuery(options);
    const [result] = await dbQuery
      .select()
      .from(currencyExchangeRatesInCore)
      .where(eq(currencyExchangeRatesInCore.id, BigInt(id)));

    return result ? exchangeRateMapper.toDomain(result) : null;
  },
};

export default exchangeRateRepo;
