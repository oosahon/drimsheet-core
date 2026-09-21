import IJournalEntryRectificationPreparationService from '@app/journal-entry/contracts/journal-entry-rectification-preparation.service.contract';

const mockJournalEntryRectificationPreparationService: jest.Mocked<IJournalEntryRectificationPreparationService> =
  {
    prepare: jest.fn(),
  };

export default mockJournalEntryRectificationPreparationService;
