import ledgerAccountBalanceRepoImpl from './ledger-account-balance.repo.impl';
import accountTransactionQueryRepo from './queries/account-transaction.query.repo.impl';

const bookkeepingRepos = {
  ledgerAccountBalance: ledgerAccountBalanceRepoImpl,

  queries: {
    accountTransaction: accountTransactionQueryRepo,
  },
};

export default bookkeepingRepos;
