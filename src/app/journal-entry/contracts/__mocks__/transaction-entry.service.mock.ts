import ITransactionEntryService from '@app/journal-entry/contracts/transaction-entry.service.contract';

const mockTransactionEntryService: jest.Mocked<ITransactionEntryService> = {
  create: jest.fn(),
};

export default mockTransactionEntryService;
