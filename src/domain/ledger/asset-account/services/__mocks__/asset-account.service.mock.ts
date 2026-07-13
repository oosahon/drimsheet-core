import IAssetAccountService from '../../types/asset-account.service.types';

const mockAssetAccountService: jest.Mocked<IAssetAccountService> = {
  bootstrapHeaderAccounts: jest.fn(),
  makePettyCashSubAccount: jest.fn(),
  bootstrapIndividualPostingAccounts: jest.fn(),
};

export default mockAssetAccountService;
