import { and, eq } from 'drizzle-orm';
import exchangeRateMapper from '../../../../app/currency/mappers/exchange-rate.mapper';
import { toRepoDate } from '../../../../app/shared/mappers/date';
import IExchangeRateRepo from '../../../../domain/currency/repos/exchange-rate.repo';
import paginationValue from '../../../../shared/value-objects/pagination.vo';
import { currencyExchangeRatesInCore } from '../../../config/drizzle/schema';
import drizzleFilters from '../helpers/filters';
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

  async find(query, options) {
    const conditions = [
      eq(currencyExchangeRatesInCore.currencyPair, query.currencyPair),
    ];

    if (query.type) {
      conditions.push(eq(currencyExchangeRatesInCore.type, query.type));
    }

    if (query.asOf) {
      conditions.push(
        eq(currencyExchangeRatesInCore.asOf, toRepoDate(query.asOf))
      );
    }

    const whereClause = and(...conditions);
    const dbQuery = getDbQuery(options);

    const direction = drizzleFilters.getSortDirection(
      paginationValue.getSortDirection(options.sortDirection)
    );

    const columnsMap = {
      currencyPair: currencyExchangeRatesInCore.currencyPair,
      baseCurrencyCode: currencyExchangeRatesInCore.baseCurrencyCode,
      targetCurrencyCode: currencyExchangeRatesInCore.targetCurrencyCode,
      rate: currencyExchangeRatesInCore.rate,
      type: currencyExchangeRatesInCore.type,
      asOf: currencyExchangeRatesInCore.asOf,
      source: currencyExchangeRatesInCore.source,
      createdAt: currencyExchangeRatesInCore.createdAt,
    };

    const sortColumn =
      columnsMap[options.orderBy] ?? currencyExchangeRatesInCore.createdAt;
    const orderByClause = direction(sortColumn);

    const limit = paginationValue.getLimit(options.limit);
    const offset = paginationValue.getOffset(options.offset);

    const results = await dbQuery
      .select()
      .from(currencyExchangeRatesInCore)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return results.map(exchangeRateMapper.toDomain);
  },
};

export default exchangeRateRepo;
