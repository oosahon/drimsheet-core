import { and, eq } from 'drizzle-orm';
import IExchangeRateRepo from '../../../../domain/money/repos/exchange-rate.repo';
import { EExchangeRateType } from '../../../../domain/money/types/exchange-rate.types';
import drizzleFilters from '../../../../shared/helpers/drizzle-filters';
import getDbQuery from '../../../../shared/helpers/get-db-query';
import paginationValue from '../../../../shared/pagination/pagination.vo';
import { currencyExchangeRatesInCore } from '../../../config/drizzle/schema';
import exchangeRateMapper from '../../mappers/money/exchange-rate.mapper';
import { toRepoDate } from '../../mappers/shared/date';

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

  async findByPairAndDate(currencyPair, asOf, options) {
    const dbQuery = getDbQuery(options);

    const [result] = await dbQuery
      .select()
      .from(currencyExchangeRatesInCore)
      .where(
        and(
          eq(currencyExchangeRatesInCore.currencyPair, currencyPair),
          eq(currencyExchangeRatesInCore.asOf, toRepoDate(asOf)),
          eq(currencyExchangeRatesInCore.type, EExchangeRateType.Official)
        )
      );

    return result ? exchangeRateMapper.toDomain(result) : null;
  },
};

export default exchangeRateRepo;
