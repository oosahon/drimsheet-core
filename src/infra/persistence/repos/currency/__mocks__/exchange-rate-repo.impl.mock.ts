import IExchangeRateRepo from '../../../../../domain/currency/repos/exchange-rate.repo';

const exchangeRateRepoMock: jest.Mocked<IExchangeRateRepo> = {
  create: jest.fn(),
  find: jest.fn(),
  findByPairAndDate: jest.fn(),
};

export default exchangeRateRepoMock;
