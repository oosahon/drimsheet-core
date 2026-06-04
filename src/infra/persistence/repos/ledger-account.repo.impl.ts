import {
  and,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  or,
  sql,
} from 'drizzle-orm';
import ledgerAccountMapper from '../../../app/ledger/mappers/ledger-account.mapper';
import ILedgerAccountRepo, {
  ELedgerAccountSortBy,
} from '../../../domain/ledger/repos/ledger-account.repo';
import paginationValue from '../../../shared/value-objects/pagination.vo';
import {
  currenciesInCore,
  ledgerAccountBalancesInCore,
  ledgerAccountsInCore,
} from '../../config/drizzle/schema';
import drizzleFilters from './helpers/filters';
import getDbQuery from './helpers/query';

const ledgerAccountRepoImpl: ILedgerAccountRepo = {
  save: async (payload, options) => {
    const dbQuery = getDbQuery(options);

    const valuesArray = Array.isArray(payload)
      ? payload.map(ledgerAccountMapper.toRepo)
      : [ledgerAccountMapper.toRepo(payload)];

    await dbQuery.insert(ledgerAccountsInCore).values(valuesArray);
  },

  findById: async (id, options) => {
    const result = await getDbQuery(options)
      .select({
        ...getTableColumns(ledgerAccountsInCore),
        currency: getTableColumns(currenciesInCore),
      })
      .from(ledgerAccountsInCore)
      .innerJoin(
        currenciesInCore,
        eq(ledgerAccountsInCore.currencyCode, currenciesInCore.code)
      )
      .where(eq(ledgerAccountsInCore.id, id));

    return result.map(ledgerAccountMapper.toDomain)[0] ?? null;
  },

  findAllByIds: async (isDate, options) => {
    const result = await getDbQuery(options)
      .select({
        ...getTableColumns(ledgerAccountsInCore),
        currency: getTableColumns(currenciesInCore),
      })
      .from(ledgerAccountsInCore)
      .innerJoin(
        currenciesInCore,
        eq(ledgerAccountsInCore.currencyCode, currenciesInCore.code)
      )
      .where(inArray(ledgerAccountsInCore.id, isDate));

    return result.map(ledgerAccountMapper.toDomain);
  },

  findByCode: async (code, accountingEntityId, options) => {
    const dbQuery = getDbQuery(options);

    const result = await dbQuery
      .select({
        ...getTableColumns(ledgerAccountsInCore),
        currency: getTableColumns(currenciesInCore),
      })
      .from(ledgerAccountsInCore)
      .innerJoin(
        currenciesInCore,
        eq(ledgerAccountsInCore.currencyCode, currenciesInCore.code)
      )
      .where(
        and(
          eq(ledgerAccountsInCore.accountingEntityId, accountingEntityId),
          eq(ledgerAccountsInCore.code, code)
        )
      );

    return result.map(ledgerAccountMapper.toDomain)[0] ?? null;
  },

  findBySubType: async (accountingEntityId, type, subType, options) => {
    const dbQuery = getDbQuery(options);

    const results = await dbQuery
      .select({
        ...getTableColumns(ledgerAccountsInCore),
        currency: getTableColumns(currenciesInCore),
      })
      .from(ledgerAccountsInCore)
      .innerJoin(
        currenciesInCore,
        eq(ledgerAccountsInCore.currencyCode, currenciesInCore.code)
      )
      .where(
        and(
          eq(ledgerAccountsInCore.accountingEntityId, accountingEntityId),
          eq(ledgerAccountsInCore.type, type),
          eq(ledgerAccountsInCore.subType, subType)
        )
      );

    return results.map(ledgerAccountMapper.toDomain);
  },

  findByBehavior: async (accountingEntityId, behavior, options) => {
    const dbQuery = getDbQuery(options);

    const results = await dbQuery
      .select({
        ...getTableColumns(ledgerAccountsInCore),
        currency: getTableColumns(currenciesInCore),
      })
      .from(ledgerAccountsInCore)
      .innerJoin(
        currenciesInCore,
        eq(ledgerAccountsInCore.currencyCode, currenciesInCore.code)
      )
      .where(
        and(
          eq(ledgerAccountsInCore.accountingEntityId, accountingEntityId),
          eq(ledgerAccountsInCore.behavior, behavior)
        )
      );

    return results.map(ledgerAccountMapper.toDomain);
  },

  findLatestBySubType: async (accountingEntityId, type, subType, options) => {
    const dbQuery = getDbQuery(options);

    const [result] = await dbQuery
      .select({
        id: ledgerAccountsInCore.id,
        code: ledgerAccountsInCore.code,
        materializedPath: ledgerAccountsInCore.materializedPath,
      })
      .from(ledgerAccountsInCore)
      .where(
        and(
          eq(ledgerAccountsInCore.accountingEntityId, accountingEntityId),
          eq(ledgerAccountsInCore.type, type),
          eq(ledgerAccountsInCore.subType, subType)
        )
      )
      .orderBy(desc(ledgerAccountsInCore.code))
      .limit(1);

    return result as unknown as ReturnType<
      ILedgerAccountRepo['findLatestBySubType']
    >;
  },

  findAll: async (accountingEntityId, options) => {
    const conditions = [
      eq(ledgerAccountsInCore.accountingEntityId, accountingEntityId),
    ];

    if (options.ids && options.ids.length > 0) {
      conditions.push(inArray(ledgerAccountsInCore.id, options.ids));
    }

    if (options.type) {
      conditions.push(eq(ledgerAccountsInCore.type, options.type));
    }

    if (options.subType) {
      conditions.push(eq(ledgerAccountsInCore.subType, options.subType));
    }
    if (options.behavior) {
      conditions.push(eq(ledgerAccountsInCore.behavior, options.behavior));
    }
    if (options.isControlAccount !== undefined) {
      conditions.push(
        eq(ledgerAccountsInCore.isControlAccount, options.isControlAccount)
      );
    }
    if (options.search) {
      conditions.push(
        or(
          ilike(ledgerAccountsInCore.name, `%${options.search}%`),
          ilike(ledgerAccountsInCore.code, `%${options.search}%`)
        )!
      );
    }

    const whereClause = and(...conditions);

    const dbQuery = getDbQuery(options);

    const [countResult] = await dbQuery
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(ledgerAccountsInCore)
      .where(whereClause);

    const totalCount = countResult?.count ?? 0;

    if (totalCount === 0) {
      return paginationValue.getPaginatedResponse([], 0, options);
    }

    const direction = drizzleFilters.getSortDirection(
      paginationValue.getSortDirection(options.sortDirection)
    );

    let orderByClause;
    if (options.orderBy === ELedgerAccountSortBy.AccountName) {
      orderByClause = direction(ledgerAccountsInCore.name);
    } else if (options.orderBy === ELedgerAccountSortBy.Balance) {
      orderByClause = direction(ledgerAccountBalancesInCore.functionalAmount);
    } else {
      orderByClause = direction(ledgerAccountsInCore.createdAt);
    }

    const limit = paginationValue.getLimit(options.limit);
    const offset = paginationValue.getOffset(options.offset);

    let baseQuery = dbQuery
      .select({
        ...getTableColumns(ledgerAccountsInCore),
        currency: getTableColumns(currenciesInCore),
      })
      .from(ledgerAccountsInCore)
      .innerJoin(
        currenciesInCore,
        eq(ledgerAccountsInCore.currencyCode, currenciesInCore.code)
      );

    if (options.orderBy === ELedgerAccountSortBy.Balance) {
      baseQuery = baseQuery.leftJoin(
        ledgerAccountBalancesInCore,
        eq(ledgerAccountsInCore.id, ledgerAccountBalancesInCore.ledgerAccountId)
      );
    }

    const results = await baseQuery
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return paginationValue.getPaginatedResponse(
      results.map(ledgerAccountMapper.toDomain),
      totalCount,
      options
    );
  },
};

export default ledgerAccountRepoImpl;
