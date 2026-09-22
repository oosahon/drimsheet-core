import IJournalEntryPersistenceService from '@app/journal-entry/contracts/journal-entry-persistence.service.contract';

const mockJournalEntryPersistenceService: jest.Mocked<IJournalEntryPersistenceService> =
  {
    create: jest.fn(),
    rectify: jest.fn(),
    delete: jest.fn(),
  };

export default mockJournalEntryPersistenceService;
