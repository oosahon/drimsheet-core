import exchangeRateMapper from '../../../../app/currency/mappers/exchange-rate.mapper';
import IExchangeRateRepo from '../../../../domain/currency/repos/exchange-rate.repo';
import { currencyExchangeRatesInCore } from '../../../config/drizzle/schema';
import getDbQuery from '../helpers/query';

const exchangeRateRepo: IExchangeRateRepo = {
  create: async (payload, options) => {
    const values = Array.isArray(payload) ? payload : [payload];
    const dbQuery = getDbQuery(options);

    await dbQuery
      .insert(currencyExchangeRatesInCore)
      .values(values.map(exchangeRateMapper.toRepo))
      .onConflictDoNothing();
  },
};

export default exchangeRateRepo;
