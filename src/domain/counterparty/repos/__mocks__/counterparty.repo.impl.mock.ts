import ICounterpartyRepo from '../counterparty.repo';

const mockCounterpartyRepo: jest.Mocked<ICounterpartyRepo> = {
  create: jest.fn(),
  findAll: jest.fn(),
};

export default mockCounterpartyRepo;
