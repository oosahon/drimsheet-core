import ITransactionEntryService from '../transaction-entry.service.contract';

const mockTransactionEntryService: jest.Mocked<ITransactionEntryService> = {
  create: jest.fn(),
};

export default mockTransactionEntryService;
