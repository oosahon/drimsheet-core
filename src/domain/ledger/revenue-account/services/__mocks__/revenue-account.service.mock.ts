import IRevenueAccountService from '../../types/revenue-account.service.types';

const mockRevenueAccountService: jest.Mocked<IRevenueAccountService> = {
  bootstrapHeaderAccounts: jest.fn(),
  bootstrapIndividualPostingAccounts: jest.fn(),
};

export default mockRevenueAccountService;
