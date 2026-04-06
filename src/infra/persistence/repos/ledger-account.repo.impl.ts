import { eq } from 'drizzle-orm';
import ledgerAccountMapper from '../../../app/mappers/ledger-account.mapper';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import { currenciesInCore, ledgerAccountsInCore } from '../drizzle/schema';
import getDbQuery from './helpers/query';

const ledgerAccountRepoImpl: ILedgerAccountRepo = {
  save: async (account, options) => {
    const dbQuery = getDbQuery(options);
    await dbQuery
      .insert(ledgerAccountsInCore)
      .values(ledgerAccountMapper.toRepo(account));
  },
  findById: async () => null,

  findByCode: async (code, accountingEntityId, options) => {
    return null;
  },
};

export default ledgerAccountRepoImpl;
