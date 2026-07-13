import IJournalEntryRepo from '../journal-entry.repo';

const mockJournalEntryRepo: jest.Mocked<IJournalEntryRepo> = {
  create: jest.fn(),
  findById: jest.fn(),
};

export default mockJournalEntryRepo;
