import IJournalEntryAttachmentRepo from '@domain/journal-entry/repos/journal-entry-attachment.repo';

import { journalEntryAttachmentsInCore } from '@infra/config/drizzle/schema';
import { toRepoDate } from '@infra/persistence/helpers/date.mapper';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import journalEntryAttachmentMapper from '@infra/persistence/repos/journal-entry/mappers/journal-entry-attachment.mapper';

const journalEntryAttachmentRepo: IJournalEntryAttachmentRepo = {
  async save(journalEntryId, attachments, options) {
    const values = journalEntryAttachmentMapper.toRepo(
      journalEntryId,
      attachments
    );

    await getDbQuery(options)
      .insert(journalEntryAttachmentsInCore)
      .values(values)
      .onConflictDoUpdate({
        target: journalEntryAttachmentsInCore.journalEntryId,
        set: {
          data: values.data,
          updatedAt: toRepoDate(new Date()),
        },
      });
  },
};

export default journalEntryAttachmentRepo;
