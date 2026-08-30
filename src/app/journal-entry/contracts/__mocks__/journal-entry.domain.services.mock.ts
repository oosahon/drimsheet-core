import { IJournalEntryService } from '@domain/journal-entry/types/journal-entry.service.types';

export const mockJournalEntryService: jest.Mocked<IJournalEntryService> = {
  createOpeningBalance: jest.fn(),
  createPayment: jest.fn(),
  createReceipt: jest.fn(),
};
