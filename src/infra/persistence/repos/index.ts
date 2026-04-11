import accountingEntityRepo from './accounting-entity.repo.impl';
import currencyRepo from './currency.repo.impl';
import ledgerAccountRepo from './ledger-account.repo.impl';
import userActivityRepo from './user-activity.repo.impl';
import userPreferencesRepo from './user-preferences.repo.impl';
import userRepo from './user.repo.impl';

const repos = {
  currency: currencyRepo,
  user: userRepo,
  accountingEntity: accountingEntityRepo,
  ledgerAccount: ledgerAccountRepo,
  userActivity: userActivityRepo,
  userPreferences: userPreferencesRepo,
};

export default repos;
