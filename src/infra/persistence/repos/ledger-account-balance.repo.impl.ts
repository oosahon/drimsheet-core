import { and, eq, getTableColumns, or } from 'drizzle-orm';
import ledgerAccountBalanceMapper from '../../../app/mappers/ledger-account-balance.mapper';
import ILedgerAccountBalanceRepo from '../../../domain/bookkeeping/repos/ledger-account-balance.repo';
import { AppError } from '../../../shared/errors/error';
import {
  currenciesInCore,
  ledgerAccountBalanceAdjustmentsInCore,
  ledgerAccountBalancesInCore,
} from '../../config/drizzle/schema';
import getDbQuery from './helpers/query';
import validateVersionInOptions from './helpers/validate-version';

const ledgerAccountBalanceRepoImpl: ILedgerAccountBalanceRepo = {
  async create(payload, options) {
    const query = getDbQuery(options);

    const values = ledgerAccountBalanceMapper.toRepo(payload);

    await query.insert(ledgerAccountBalancesInCore).values(values);
  },

  async findBalanceByAccountId(ledgerAccountId, accountingEntityId, options) {
    const query = getDbQuery(options);

    const [result] = await query
      .select({
        ...getTableColumns(ledgerAccountBalancesInCore),
        currency: getTableColumns(currenciesInCore),
        functionalCurrency: getTableColumns(currenciesInCore),
      })
      .from(ledgerAccountBalancesInCore)
      .innerJoin(
        currenciesInCore,
        or(
          eq(ledgerAccountBalancesInCore.currencyCode, currenciesInCore.code),
          eq(
            ledgerAccountBalancesInCore.functionalCurrencyCode,
            currenciesInCore.code
          )
        )
      )
      .where(
        and(
          eq(ledgerAccountBalancesInCore.ledgerAccountId, ledgerAccountId),
          eq(ledgerAccountBalancesInCore.accountingEntityId, accountingEntityId)
        )
      );

    return result ? ledgerAccountBalanceMapper.toDomain(result) : null;
  },

  async adjustBalance(payload, options) {
    validateVersionInOptions(options);

    const { newBalance, adjustment } = payload;

    await getDbQuery(options).transaction(async (tx) => {
      await tx
        .insert(ledgerAccountBalanceAdjustmentsInCore)
        .values(ledgerAccountBalanceMapper.toRepoAdjustment(adjustment));

      const updated = await tx
        .update(ledgerAccountBalancesInCore)
        .set(
          ledgerAccountBalanceMapper.toRepo({
            ...newBalance,
            version: newBalance.version + 1,
          })
        )
        .where(
          and(
            eq(
              ledgerAccountBalancesInCore.ledgerAccountId,
              newBalance.ledgerAccountId
            ),
            eq(
              ledgerAccountBalancesInCore.accountingEntityId,
              newBalance.accountingEntityId
            ),
            eq(ledgerAccountBalancesInCore.version, options.expectedVersion!)
          )
        );

      if (updated.rowCount === 0) {
        throw new AppError('Failed to update ledger account balance', {
          cause: {
            ledgerAccountId: newBalance.ledgerAccountId,
            version: options.expectedVersion,
          },
        });
      }
    });
  },

  async findAdjustmentsByAccountId(ledgerAccountId, options) {
    const result = await getDbQuery(options)
      .select()
      .from(ledgerAccountBalanceAdjustmentsInCore)
      .where(
        and(
          eq(
            ledgerAccountBalanceAdjustmentsInCore.ledgerAccountId,
            ledgerAccountId
          )
        )
      );

    return result.map(ledgerAccountBalanceMapper.fromRepoAdjustment);
  },
};

export default ledgerAccountBalanceRepoImpl;
