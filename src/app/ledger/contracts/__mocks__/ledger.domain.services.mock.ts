import { IAssetDisposalLossAccountService } from '../../../../domain/ledger/types/asset-disposal-loss.service.types';
import { IBankChargeAccountService } from '../../../../domain/ledger/types/bank-charge.service.types';
import ICashAccountService from '../../../../domain/ledger/types/cash-account.service.types';
import { IDirectCostsAccountService } from '../../../../domain/ledger/types/direct-costs.service.types';
import { IEquityAccountService } from '../../../../domain/ledger/types/equity-account.service.types';
import { IFinanceCostAccountService } from '../../../../domain/ledger/types/finance-cost.service.types';
import { IInterestAccountService } from '../../../../domain/ledger/types/interest.service.types';
import { IPayablesAccountService } from '../../../../domain/ledger/types/payables.service.types';
import { IReceivablesAccountService } from '../../../../domain/ledger/types/receivables-account.service.types';
import { IRentAndUtilitiesAccountService } from '../../../../domain/ledger/types/rent-and-utilities.service.types';
import { IShortTermLoanAccountService } from '../../../../domain/ledger/types/short-term-loan.service.types';
import { ISuspenseAccountService } from '../../../../domain/ledger/types/suspense-account.service.types';
import { ITaxExpenseAccountService } from '../../../../domain/ledger/types/tax-expense.service.types';
import { IUnrealizedLossAccountService } from '../../../../domain/ledger/types/unrealized-loss.service.types';

export const mockBankChargeAccountService: jest.Mocked<IBankChargeAccountService> =
  {
    createHeader: jest.fn(),
    createSubAccount: jest.fn(),
  };

export const mockDirectCostsAccountService: jest.Mocked<IDirectCostsAccountService> =
  {
    createHeader: jest.fn(),
    createSubAccount: jest.fn(),
  };

export const mockFinanceCostAccountService: jest.Mocked<IFinanceCostAccountService> =
  {
    createHeader: jest.fn(),
    createSubAccount: jest.fn(),
  };

export const mockInterestAccountService: jest.Mocked<IInterestAccountService> =
  {
    createHeader: jest.fn(),
    createSubAccount: jest.fn(),
  };

export const mockRentAndUtilitiesAccountService: jest.Mocked<IRentAndUtilitiesAccountService> =
  {
    createHeader: jest.fn(),
    createSubAccount: jest.fn(),
  };

export const mockTaxExpenseAccountService: jest.Mocked<ITaxExpenseAccountService> =
  {
    createHeader: jest.fn(),
    createSubAccount: jest.fn(),
  };

export const mockUnrealizedLossAccountService: jest.Mocked<IUnrealizedLossAccountService> =
  {
    createHeader: jest.fn(),
    createSubAccount: jest.fn(),
  };

export const mockAssetDisposalLossAccountService: jest.Mocked<IAssetDisposalLossAccountService> =
  {
    createHeader: jest.fn(),
    createSubAccount: jest.fn(),
  };

export const mockAssetAccountService: jest.Mocked<ICashAccountService> = {
  createHeader: jest.fn(),
  createPettyCashSubAccount: jest.fn(),
  createBankSubAccount: jest.fn(),
};

export const mockReceivablesAccountService: jest.Mocked<IReceivablesAccountService> =
  {
    createHeader: jest.fn(),
    createStatutoryReceivableSubAccount: jest.fn(),
    createTradeReceivableSubAccount: jest.fn(),
  };

export const mockSuspenseAccountService: jest.Mocked<ISuspenseAccountService> =
  {
    createAssetSuspense: jest.fn(),
    createLiabilitySuspense: jest.fn(),
  };

export const mockPayablesAccountService: jest.Mocked<IPayablesAccountService> =
  {
    createHeader: jest.fn(),
    createStatutoryPayableSubAccount: jest.fn(),
    createTradePayableSubAccount: jest.fn(),
  };

export const mockShortTermLoanAccountService: jest.Mocked<IShortTermLoanAccountService> =
  {
    createHeader: jest.fn(),
    createSubAccount: jest.fn(),
    createCreditCardSubAccount: jest.fn(),
  };

export const mockEquityAccountService: jest.Mocked<IEquityAccountService> = {
  createOpeningBalanceAccount: jest.fn(),
  createRetainedEarningsAccount: jest.fn(),
};
