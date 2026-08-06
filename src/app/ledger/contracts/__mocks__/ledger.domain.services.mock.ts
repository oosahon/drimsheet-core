import IAssetAccountService from '../../../../domain/ledger/asset-account/types/asset-account.service.types';

export const mockAssetAccountService: jest.Mocked<IAssetAccountService> = {
  makePettyCashSubAccount: jest.fn(),
  makeBankSubAccount: jest.fn(),
};
