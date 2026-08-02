import { IJournalEntryService } from '../journal-entry.service.types';

const mockJournalEntryService: jest.Mocked<IJournalEntryService> = {
  createOpeningBalance: jest.fn(),
};

export default mockJournalEntryService;
