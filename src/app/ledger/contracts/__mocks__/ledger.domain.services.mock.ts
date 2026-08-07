import IAssetAccountService from '../../../../domain/ledger/asset-account/types/asset-account.service.types';

export const mockAssetAccountService: jest.Mocked<IAssetAccountService> = {
  createPettyCashSubAccount: jest.fn(),
  createBankSubAccount: jest.fn(),
};
