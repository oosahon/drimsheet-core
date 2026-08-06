import IExchangeRateRepo from '../../../../domain/money/repos/exchange-rate.repo';

export const mockExchangeRateRepo: jest.Mocked<IExchangeRateRepo> = {
  create: jest.fn(),
  find: jest.fn(),
  findByPairAndDate: jest.fn(),
};
