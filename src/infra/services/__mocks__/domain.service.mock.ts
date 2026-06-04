import IAccountingEntityService from '../../../domain/accounting/types/accounting-entity.service.types';
import IAccountBalanceService from '../../../domain/bookkeeping/types/account-balance.service.types';
import IBookkeepingService from '../../../domain/bookkeeping/types/bookkeeping.service.types';
import IExchangeRateService from '../../../domain/currency/types/exchange-rate.service.types';
import IAssetAccountService from '../../../domain/ledger/types/asset-account.service.types';
import IEquityAccountService from '../../../domain/ledger/types/equity-account.service.types';
import IExpenseAccountService from '../../../domain/ledger/types/expense-account.service.types';
import { ILedgerAccountService } from '../../../domain/ledger/types/ledger-account.service.types';
import ILiabilityAccountService from '../../../domain/ledger/types/liability-account.service.types';
import IRevenueAccountService from '../../../domain/ledger/types/revenue-account.service.types';
import IUserPreferencesService from '../../../domain/user/types/user-preferences.service.types';

const userPreferences: jest.Mocked<IUserPreferencesService> = {
  update: jest.fn(),
};

const accountingEntity: jest.Mocked<IAccountingEntityService> = {
  grantUserAccess: jest.fn(),
  validateAccess: jest.fn(),
};

const ledgerAccount: jest.Mocked<ILedgerAccountService> = {
  validateAccountAccess: jest.fn(),
};

const assetAccount: jest.Mocked<IAssetAccountService> = {
  bootstrapHeaderAccounts: jest.fn(),
  makePettyCashSubAccount: jest.fn(),
  bootstrapIndividualPostingAccounts: jest.fn(),
};

const liabilityAccount: jest.Mocked<ILiabilityAccountService> = {
  bootstrapHeaderAccounts: jest.fn(),
  bootstrapIndividualPostingAccounts: jest.fn(),
};

const equityAccount: jest.Mocked<IEquityAccountService> = {
  bootstrapHeaderAccounts: jest.fn(),
};

const revenueAccount: jest.Mocked<IRevenueAccountService> = {
  bootstrapHeaderAccounts: jest.fn(),
  bootstrapIndividualPostingAccounts: jest.fn(),
};

const expenseAccount: jest.Mocked<IExpenseAccountService> = {
  bootstrapHeaderAccounts: jest.fn(),
  bootstrapIndividualPostingAccounts: jest.fn(),
};

const exchangeRate: jest.Mocked<IExchangeRateService> = {
  getOfficialExchangeRate: jest.fn(),
  getExchangeRate: jest.fn(),
};

const bookkeeping: jest.Mocked<IBookkeepingService> = {
  recordOpeningBalance: jest.fn(),
  recordTransaction: jest.fn(),
  getBalanceEffectDelta: jest.fn(),
};

const accountBalance: jest.Mocked<IAccountBalanceService> = {
  createBalance: jest.fn(),
};

const mockDomainServices = Object.freeze({
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

export default mockDomainServices;
