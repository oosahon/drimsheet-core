import bankAccountRepoImpl from './bank-account.repo.impl';
import ledgerAccountBalanceRepoImpl from './ledger-account-balance.repo.impl';
import ledgerAccountHistoryRepo from './ledger-account-history.repo.impl';
import ledgerAccountRepo from './ledger-account.repo.impl';
import accountTransactionQueryRepo from './queries/account-transaction.query.repo.impl';

const ledgerRepos = {
  ledgerAccount: ledgerAccountRepo,
  bankAccount: bankAccountRepoImpl,
  ledgerAccountBalance: ledgerAccountBalanceRepoImpl,
  ledgerAccountHistory: ledgerAccountHistoryRepo,

  queries: {
    accountTransaction: accountTransactionQueryRepo,
  },
};

export default ledgerRepos;
