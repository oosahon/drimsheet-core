import { InferSelectModel } from 'drizzle-orm';

import { TEntityId } from '@shared/types/uuid';
import { IFileAttachment } from '@shared/values/file-attachments/types/file-attachment.types';

import { journalEntryAttachmentsInCore } from '@infra/config/drizzle/schema';

export interface IJournalEntryAttachmentModel extends InferSelectModel<
  typeof journalEntryAttachmentsInCore
> {}

const journalEntryAttachmentMapper = {
  toDomain(payload: IJournalEntryAttachmentModel): IFileAttachment[] {
    return payload.data as IFileAttachment[];
  },

  toRepo(journalEntryId: TEntityId, attachments: IFileAttachment[]) {
    return {
      journalEntryId,
      data: attachments,
    };
  },
};

export default journalEntryAttachmentMapper;
