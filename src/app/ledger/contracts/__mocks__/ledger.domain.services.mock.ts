import ICashAccountService from '../../../../domain/ledger/types/cash-account.service.types';

export const mockAssetAccountService: jest.Mocked<ICashAccountService> = {
  createPettyCashSubAccount: jest.fn(),
  createBankSubAccount: jest.fn(),
};
