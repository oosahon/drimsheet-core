import IJournalEntryPersistenceService from '../../../../domain/journal-entry/types/journal-entry-persistence.service.types';
import IJournalEntryService from '../../../../domain/journal-entry/types/journal-entry.service.types';

const journalEntry: jest.Mocked<IJournalEntryService> = {
  recordOpeningBalance: jest.fn(),
  recordTransaction: jest.fn(),
  getBalanceEffectDelta: jest.fn(),
};
const journalEntryPersistence: jest.Mocked<IJournalEntryPersistenceService> = {
  create: jest.fn(),
};

const mockJournalEntryDomainServices = Object.freeze({
  journalEntry,
  journalEntryPersistence,
});

export default mockJournalEntryDomainServices;
