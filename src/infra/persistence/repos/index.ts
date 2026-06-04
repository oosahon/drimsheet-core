import accountingContextRepo from './accounting-context.repo.impl';
import accountingEntityRepo from './accounting-entity.repo.impl';
import accountingPeriodRepo from './accounting-period.repo.impl';
import accountingStandardsRepo from './accounting-standards.repo.impl';
import currencyRepo from './currency.repo.impl';
import exchangeRateRepo from './exchange-rate.repo.impl';
import fiscalYearRepo from './fiscal-year.repo.impl';
import journalEntryRepo from './journal-entry.repo.impl';
import journalLineRepo from './journal-line.repo.impl';
import jurisdictionAccountingStandardRepo from './jurisdiction-accounting-standard.repo.impl';
import jurisdictionRepo from './jurisdiction.repo.impl';
import ledgerAccountBalanceRepoImpl from './ledger-account-balance.repo.impl';
import ledgerAccountRepo from './ledger-account.repo.impl';
import reportingContextRepo from './reporting-context.repo.impl';
import reportingPeriodRepo from './reporting-period.repo.impl';
import userActivityRepo from './user-activity.repo.impl';
import userAuthRepo from './user-auth.repo.impl';
import userPreferencesRepo from './user-preferences.repo.impl';
import userSessionRepo from './user-session.repo.impl';
import userRepo from './user.repo.impl';

const repos = {
  currency: currencyRepo,
  user: userRepo,
  accountingEntity: accountingEntityRepo,
  ledgerAccount: ledgerAccountRepo,
  userActivity: userActivityRepo,
  userPreferences: userPreferencesRepo,
  userAuth: userAuthRepo,
  userSession: userSessionRepo,
  journalEntry: journalEntryRepo,
  journalLine: journalLineRepo,
  exchangeRate: exchangeRateRepo,
  ledgerAccountBalance: ledgerAccountBalanceRepoImpl,
  fiscalYear: fiscalYearRepo,
  accountingPeriod: accountingPeriodRepo,
  accountingContext: accountingContextRepo,
  reportingPeriod: reportingPeriodRepo,
  reportingContext: reportingContextRepo,
  accountingStandards: accountingStandardsRepo,
  jurisdiction: jurisdictionRepo,
  jurisdictionAccountingStandard: jurisdictionAccountingStandardRepo,
};

export default repos;
