import { IJournalEntryService } from '@domain/journal-entry/types/journal-entry.service.types';

const mockJournalEntryService: jest.Mocked<IJournalEntryService> = {
  createOpeningBalance: jest.fn(),
  createPayment: jest.fn(),
  createReceipt: jest.fn(),
  createTransfer: jest.fn(),
};

export default mockJournalEntryService;
