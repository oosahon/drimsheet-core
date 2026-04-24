import IExchangeRateRepo from '../../../../domain/currency/repos/exchange-rate.repo';

const exchangeRateRepoMock: jest.Mocked<IExchangeRateRepo> = {
  save: jest.fn(),
  getById: jest.fn(),
};

export default exchangeRateRepoMock;
