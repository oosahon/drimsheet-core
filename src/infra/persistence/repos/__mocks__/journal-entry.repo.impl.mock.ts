import IJournalEntryRepo from '../../../../domain/journal-entry/repos/journal-entry.repo';

const mockJournalEntryRepo: jest.Mocked<IJournalEntryRepo> = {
  save: jest.fn(),
};

export default mockJournalEntryRepo;
