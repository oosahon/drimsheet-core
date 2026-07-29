import { and, eq } from 'drizzle-orm';
import assetAccountError from '../../../../domain/ledger/asset-account/errors/asset-account.error';
import IBankAccountRepo from '../../../../domain/ledger/asset-account/repos/bank-account.repo';
import { IRepoOptions } from '../../../../shared/types/repo.types';
import { bankAccountsInCore } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import bankAccountMapper from '../../mappers/ledger/bank-account.mapper';

const bankAccountRepoImpl: IBankAccountRepo = {
  findOne: async (bankName, accountNumber, options) => {
    const baseQuery = getDbQuery((options ?? {}) as IRepoOptions)
      .select()
      .from(bankAccountsInCore)
      .where(
        and(
          eq(bankAccountsInCore.bankName, bankName),
          eq(bankAccountsInCore.accountNumber, accountNumber)
        )
      );

    const query = options?.lock ? baseQuery.for(options.lock) : baseQuery;
    const [result] = await query;

    return result ? bankAccountMapper.toDomain(result) : null;
  },

  findByLedgerAccountId: async (ledgerAccountId, options) => {
    const baseQuery = getDbQuery((options ?? {}) as IRepoOptions)
      .select()
      .from(bankAccountsInCore)
      .where(eq(bankAccountsInCore.ledgerAccountId, ledgerAccountId));

    const query = options?.lock ? baseQuery.for(options.lock) : baseQuery;
    const [result] = await query;

    return result ? bankAccountMapper.toDomain(result) : null;
  },

  create: async (ledgerAccountId, accountingEntityId, bankValue, options) => {
    try {
      const model = bankAccountMapper.toRepo(
        ledgerAccountId,
        accountingEntityId,
        bankValue
      );
      await getDbQuery(options).insert(bankAccountsInCore).values(model);
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === '23505'
      ) {
        throw new assetAccountError.DuplicateBankAccount({
          bankName: bankValue.bankName,
          accountNumber: bankValue.accountNumber,
        });
      }
      throw err;
    }
  },
};

export default bankAccountRepoImpl;
