import IJournalEntryService from '../../../../domain/journal-entry/types/journal-entry.service.types';

const journalEntry: jest.Mocked<IJournalEntryService> = {
  recordOpeningBalance: jest.fn(),
  recordTransaction: jest.fn(),
  getBalanceEffectDelta: jest.fn(),
};

const mockJournalEntryDomainServices = Object.freeze({
  journalEntry,
});

export default mockJournalEntryDomainServices;
