import IAssetAccountService from '../../types/asset-account.service.types';

const mockAssetAccountService: jest.Mocked<IAssetAccountService> = {
  makePettyCashSubAccount: jest.fn(),
};

export default mockAssetAccountService;
