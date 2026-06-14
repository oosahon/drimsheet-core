import IJournalEntryHistoryRepo from '../../../../../domain/journal-entry/repos/journal-entry-history.repo';

const mockJournalEntryHistoryRepo: jest.Mocked<IJournalEntryHistoryRepo> = {
  save: jest.fn(),
};

export default mockJournalEntryHistoryRepo;
