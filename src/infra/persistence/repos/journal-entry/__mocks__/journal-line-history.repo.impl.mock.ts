import IJournalLineHistoryRepo from '../../../../../domain/journal-entry/repos/journal-line-history.repo';

const mockJournalLineHistoryRepo: jest.Mocked<IJournalLineHistoryRepo> = {
  create: jest.fn(),
};

export default mockJournalLineHistoryRepo;
