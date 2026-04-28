import makeAccountingEntityService from '../../domain/accounting/services/accounting-entity.service';
import makeLedgerAccountBalanceService from '../../domain/bookkeeping/services/account-balance.service';
import makeBookkeepingService from '../../domain/bookkeeping/services/bookkeeping.service';
import makeExchangeRateService from '../../domain/currency/services/exchange-rate.service';
import makeAssetAccountService from '../../domain/ledger/services/asset-account.service';
import makeUserPreferencesService from '../../domain/user/services/user-preferences.service';
import repos from '../persistence/repos';

const userPreferences = makeUserPreferencesService(repos.userPreferences);
const accountingEntity = makeAccountingEntityService(repos.accountingEntity);

const assetAccount = makeAssetAccountService(
  repos.ledgerAccount,
  accountingEntity
);

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
  assetAccount,
  exchangeRate,
  bookkeeping,
  accountBalance,
});

export default domainServices;
