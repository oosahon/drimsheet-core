import ICashAccountService from '../../../../domain/ledger/types/cash-account.service.types';

export const mockAssetAccountService: jest.Mocked<ICashAccountService> = {
  createHeader: jest.fn(),
  createPettyCashSubAccount: jest.fn(),
  createBankSubAccount: jest.fn(),
};
