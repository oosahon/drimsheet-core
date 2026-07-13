import IJournalLineRepo from '../journal-line.repo';

const mockJournalLineRepo: jest.Mocked<IJournalLineRepo> = {
  create: jest.fn(),
  findAllByAccountId: jest.fn(),
};

export default mockJournalLineRepo;
