import ILiabilityAccountService from '../../types/liability-account.service.types';

const mockLiabilityAccountService: jest.Mocked<ILiabilityAccountService> = {
  bootstrapHeaderAccounts: jest.fn(),
  bootstrapIndividualPostingAccounts: jest.fn(),
};

export default mockLiabilityAccountService;
