import { TEntityId } from '@shared/types/uuid';

import journalEntryAttachmentMapper, {
  IJournalEntryAttachmentModel,
} from '@infra/persistence/repos/journal-entry/mappers/journal-entry-attachment.mapper';

describe('journalEntryAttachmentMapper', () => {
  const journalEntryId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
  const attachments = [
    {
      url: 'https://files.example.com/receipt.pdf',
      name: 'Receipt original.pdf',
      type: 'application/pdf',
      size: 2048,
    },
  ];

  it('maps a complete attachment collection to persistence', () => {
    expect(
      journalEntryAttachmentMapper.toRepo(journalEntryId, attachments)
    ).toEqual({
      journalEntryId,
      data: attachments,
    });
  });

  it('maps persisted JSON to attachment values', () => {
    const model: IJournalEntryAttachmentModel = {
      journalEntryId,
      data: attachments,
      createdAt: '2026-08-26T00:00:00.000Z',
      updatedAt: '2026-08-26T00:00:00.000Z',
    };

    const result = journalEntryAttachmentMapper.toDomain(model);

    expect(result).toEqual(attachments);
  });
});
