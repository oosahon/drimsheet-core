import makeAccountingEntityService from '../../domain/accounting/services/accounting-entity.service';
import makeLedgerAccountBalanceService from '../../domain/bookkeeping/services/account-balance.service';
import makeBookkeepingService from '../../domain/bookkeeping/services/bookkeeping.service';
import makeExchangeRateService from '../../domain/currency/services/exchange-rate.service';
import makeAssetAccountService from '../../domain/ledger/services/asset-account.service';
import makeEquityAccountService from '../../domain/ledger/services/equity-account.service';
import makeExpenseAccountService from '../../domain/ledger/services/expense-account.service';
import makeLedgerAccountService from '../../domain/ledger/services/ledger-account.service';
import makeLiabilityAccountService from '../../domain/ledger/services/liability-account.service';
import makeRevenueAccountService from '../../domain/ledger/services/revenue-account.service';
import makeUserPreferencesService from '../../domain/user/services/user-preferences.service';
import repos from '../persistence/repos';

const userPreferences = makeUserPreferencesService(repos.userPreferences);

const accountingEntity = makeAccountingEntityService(repos.accountingEntity);

const ledgerAccount = makeLedgerAccountService(repos.ledgerAccount);
const assetAccount = makeAssetAccountService(repos.ledgerAccount);
const liabilityAccount = makeLiabilityAccountService(repos.ledgerAccount);
const equityAccount = makeEquityAccountService(repos.ledgerAccount);
const revenueAccount = makeRevenueAccountService(repos.ledgerAccount);
const expenseAccount = makeExpenseAccountService(repos.ledgerAccount);

const exchangeRate = makeExchangeRateService(repos.exchangeRate);

const bookkeeping = makeBookkeepingService(
  repos.ledgerAccount,
  repos.ledgerAccountBalance
);

const accountBalance = makeLedgerAccountBalanceService(
  repos.ledgerAccountBalance
);

const domainServices = Object.freeze({
  userPreferences,

  accountingEntity,

  ledgerAccount,
  assetAccount,
  liabilityAccount,
  equityAccount,
  revenueAccount,
  expenseAccount,

  exchangeRate,

  bookkeeping,

  accountBalance,
});

export default domainServices;
