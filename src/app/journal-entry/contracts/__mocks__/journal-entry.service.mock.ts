import { IJournalEntryService } from '../../../../domain/journal-entry/types/journal-entry.service.types';

const mockJournalEntryService: jest.Mocked<IJournalEntryService> = {
  createReceipt: jest.fn(),
};

export default mockJournalEntryService;
