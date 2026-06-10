import ledgerAccountBalanceRepoImpl from './ledger-account-balance.repo.impl';
import ledgerAccountRepo from './ledger-account.repo.impl';
import accountTransactionQueryRepo from './queries/account-transaction.query.repo.impl';

const ledgerRepos = {
  ledgerAccount: ledgerAccountRepo,
  ledgerAccountBalance: ledgerAccountBalanceRepoImpl,

  queries: {
    accountTransaction: accountTransactionQueryRepo,
  },
};

export default ledgerRepos;
