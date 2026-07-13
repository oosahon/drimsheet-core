import IAssetAccountService from '../../asset-account/types/asset-account.service.types';
import IEquityAccountService from '../../equity-account/types/equity-account.service.types';
import IExpenseAccountService from '../../expense-account/types/expense-account.service.types';
import ILiabilityAccountService from '../../liability-account/types/liability-account.service.types';
import IRevenueAccountService from '../../revenue-account/types/revenue-account.service.types';
import ILedgerAccountPersistenceService from '../../shared/types/ledger-account-persistence.service.types';
import { ILedgerAccountService } from '../../shared/types/ledger-account.service.types';

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

const persistence: jest.Mocked<ILedgerAccountPersistenceService> = {
  create: jest.fn(),
};

const mockLedgerDomainServices = Object.freeze({
  ledgerAccount,
  assetAccount,
  liabilityAccount,
  equityAccount,
  revenueAccount,
  expenseAccount,
  persistence,
});

export default mockLedgerDomainServices;
