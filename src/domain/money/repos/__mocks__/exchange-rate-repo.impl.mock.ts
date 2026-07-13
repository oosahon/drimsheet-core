import IExchangeRateRepo from '../exchange-rate.repo';

const exchangeRateRepoMock: jest.Mocked<IExchangeRateRepo> = {
  create: jest.fn(),
  find: jest.fn(),
  findByPairAndDate: jest.fn(),
};

export default exchangeRateRepoMock;
