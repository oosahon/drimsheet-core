import { and, eq, getTableColumns } from 'drizzle-orm';
import ledgerAccountMapper from '../../../app/mappers/ledger-account.mapper';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import { currenciesInCore, ledgerAccountsInCore } from '../drizzle/schema';
import getDbQuery from './helpers/query';

const ledgerAccountRepoImpl: ILedgerAccountRepo = {
  save: async (payload, options) => {
    const dbQuery = getDbQuery(options);

    const valuesArray = Array.isArray(payload)
      ? payload.map(ledgerAccountMapper.toRepo)
      : [ledgerAccountMapper.toRepo(payload)];

    await dbQuery.insert(ledgerAccountsInCore).values(valuesArray);
  },

  findById: async () => null,

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
};

export default ledgerAccountRepoImpl;
