import IEquityAccountService from '../../types/equity-account.service.types';

const mockEquityAccountService: jest.Mocked<IEquityAccountService> = {
  bootstrapHeaderAccounts: jest.fn(),
};

export default mockEquityAccountService;
