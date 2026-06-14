import IJournalEntryPersistenceService from '../../../../domain/journal-entry/types/journal-entry-persistence.service.types';

const mockJournalEntryPersistenceService: jest.Mocked<IJournalEntryPersistenceService> =
  {
    save: jest.fn(),
  };

export default mockJournalEntryPersistenceService;
