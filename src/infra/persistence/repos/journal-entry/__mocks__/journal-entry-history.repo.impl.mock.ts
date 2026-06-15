import IJournalEntryHistoryRepo from '../../../../../domain/journal-entry/repos/journal-entry-history.repo';

const mockJournalEntryHistoryRepo: jest.Mocked<IJournalEntryHistoryRepo> = {
  create: jest.fn(),
};

export default mockJournalEntryHistoryRepo;
