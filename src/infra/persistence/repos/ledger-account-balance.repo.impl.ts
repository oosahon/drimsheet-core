import ledgerAccountBalanceMapper from '../../../app/mappers/ledger-account-balance.mapper';
import ILedgerAccountBalanceRepo from '../../../domain/accounting/repos/ledger-account-balance.repo';
import { ledgerAccountBalancesInCore } from '../../config/drizzle/schema';
import getDbQuery from './helpers/query';

const ledgerAccountBalanceRepoImpl: ILedgerAccountBalanceRepo = {
  async create(payload, options) {
    const query = getDbQuery(options);

    const values = ledgerAccountBalanceMapper.toRepo(payload);

    await query.insert(ledgerAccountBalancesInCore).values(values);
  },
};

export default ledgerAccountBalanceRepoImpl;
