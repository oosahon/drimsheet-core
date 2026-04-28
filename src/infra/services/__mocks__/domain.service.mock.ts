import IAccountingEntityService from '../../../domain/accounting/types/accounting-entity.service.types';
import IAccountBalanceService from '../../../domain/bookkeeping/types/account-balance.service.types';
import IBookkeepingService from '../../../domain/bookkeeping/types/bookkeeping.service.types';
import IExchangeRateService from '../../../domain/currency/types/exchange-rate.service.types';
import IAssetAccountService from '../../../domain/ledger/types/asset-account.service.types';
import IUserPreferencesService from '../../../domain/user/types/user-preferences.service.types';

const userPreferences: jest.Mocked<IUserPreferencesService> = {
  update: jest.fn(),
};

const accountingEntity: jest.Mocked<IAccountingEntityService> = {
  create: jest.fn(),
  grantUserAccess: jest.fn(),
  validateAccess: jest.fn(),
};

const assetAccount: jest.Mocked<IAssetAccountService> = {
  createPettyCashAccount: jest.fn(),
};

const exchangeRate: jest.Mocked<IExchangeRateService> = {
  getOfficialExchangeRate: jest.fn(),
  getExchangeRate: jest.fn(),
};

const bookkeeping: jest.Mocked<IBookkeepingService> = {
  createOpeningBalanceJournalEntry: jest.fn(),
  getBalanceEffectDelta: jest.fn(),
};

const accountBalance: jest.Mocked<IAccountBalanceService> = {
  createBalance: jest.fn(),
};

const mockDomainServices = Object.freeze({
  userPreferences,
  accountingEntity,
  assetAccount,
  exchangeRate,
  bookkeeping,
  accountBalance,
});

export default mockDomainServices;
