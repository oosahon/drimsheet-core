import IAssetAccountService from '../../types/asset-account.service.types';

const mockAssetAccountService: jest.Mocked<IAssetAccountService> = {
  makePettyCashSubAccount: jest.fn(),
  makeBankSubAccount: jest.fn(),
};

export default mockAssetAccountService;
