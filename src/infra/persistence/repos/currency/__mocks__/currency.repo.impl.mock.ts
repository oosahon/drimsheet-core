import ICurrencyRepo from '../../../../../domain/currency/repos/currency.repo';

const mockCurrencyRepo: jest.Mocked<ICurrencyRepo> = {
  create: jest.fn(),
  findByCode: jest.fn(),
  findAll: jest.fn(),
};

export default mockCurrencyRepo;
