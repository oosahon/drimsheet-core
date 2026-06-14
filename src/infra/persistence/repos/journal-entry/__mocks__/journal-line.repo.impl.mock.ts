import IJournalLineRepo from '../../../../../domain/journal-entry/repos/journal-line.repo';

const mockJournalLineRepo: jest.Mocked<IJournalLineRepo> = {
  save: jest.fn(),
  findAllByAccountId: jest.fn(),
};

export default mockJournalLineRepo;
