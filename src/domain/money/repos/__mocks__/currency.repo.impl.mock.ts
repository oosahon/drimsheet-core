import ICurrencyRepo from '../currency.repo';

const mockCurrencyRepo: jest.Mocked<ICurrencyRepo> = {
  create: jest.fn(),
  findByCode: jest.fn(),
  findAll: jest.fn(),
};

export default mockCurrencyRepo;
