import ICounterpartyAppService from '@app/counterparty/contracts/counterparty.service.contract';

const mockCounterpartyAppService: jest.Mocked<ICounterpartyAppService> = {
  findOrCreate: jest.fn(),
  findOrCreateMany: jest.fn(),
  getFoundOrCreated: jest.fn(),
};

export default mockCounterpartyAppService;
