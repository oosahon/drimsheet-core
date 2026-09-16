import IJournalEntryAttachmentRepo from '@domain/journal-entry/repos/journal-entry-attachment.repo';
import IJournalEntryRepo from '@domain/journal-entry/repos/journal-entry.repo';
import IJournalLineRepo from '@domain/journal-entry/repos/journal-line.repo';

export const mockJournalEntryAttachmentRepo: jest.Mocked<IJournalEntryAttachmentRepo> =
  {
    save: jest.fn(),
  };

export const mockJournalEntryRepo: jest.Mocked<IJournalEntryRepo> = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
};

export const mockJournalLineRepo: jest.Mocked<IJournalLineRepo> = {
  create: jest.fn(),
  findAllByAccountId: jest.fn(),
};
