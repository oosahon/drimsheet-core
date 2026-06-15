import IExchangeRateRepo from '../../../../../domain/currency/repos/exchange-rate.repo';

const exchangeRateRepoMock: jest.Mocked<IExchangeRateRepo> = {
  create: jest.fn(),
  getById: jest.fn(),
};

export default exchangeRateRepoMock;
