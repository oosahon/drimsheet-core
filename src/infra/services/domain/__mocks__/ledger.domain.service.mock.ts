import IAssetAccountService from '../../../../domain/ledger/types/asset-account.service.types';
import IEquityAccountService from '../../../../domain/ledger/types/equity-account.service.types';
import IExpenseAccountService from '../../../../domain/ledger/types/expense-account.service.types';
import { ILedgerAccountService } from '../../../../domain/ledger/types/ledger-account.service.types';
import ILiabilityAccountService from '../../../../domain/ledger/types/liability-account.service.types';
import IRevenueAccountService from '../../../../domain/ledger/types/revenue-account.service.types';

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

const mockLedgerDomainServices = Object.freeze({
  ledgerAccount,
  assetAccount,
  liabilityAccount,
  equityAccount,
  revenueAccount,
  expenseAccount,
});

export default mockLedgerDomainServices;
