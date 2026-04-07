import { eq } from 'drizzle-orm';
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
    return null;
  },
};

export default ledgerAccountRepoImpl;
