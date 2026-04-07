import accountingEntityRepo from './accounting-entity.repo.impl';
import currencyRepo from './currency.repo.impl';
import userRepo from './user.repo.impl';
import ledgerAccountRepo from './ledger-account.repo.impl';

const repos = {
  currency: currencyRepo,
  user: userRepo,
  accountingEntity: accountingEntityRepo,
  ledgerAccount: ledgerAccountRepo,
};

export default repos;
