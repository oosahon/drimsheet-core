import ICashAccountService from '../../../../domain/ledger/types/cash-account.service.types';
import { IReceivablesAccountService } from '../../../../domain/ledger/types/receivables-account.service.types';
import { ISuspenseAccountService } from '../../../../domain/ledger/types/suspense-account.service.types';

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
