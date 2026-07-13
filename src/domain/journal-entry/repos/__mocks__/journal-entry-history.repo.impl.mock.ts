import IJournalEntryHistoryRepo from '../journal-entry-history.repo';

const mockJournalEntryHistoryRepo: jest.Mocked<IJournalEntryHistoryRepo> = {
  create: jest.fn(),
};

export default mockJournalEntryHistoryRepo;
