import { IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';
import { IFileAttachment } from '@shared/values/file-attachments/types/file-attachment.types';

export default interface IJournalEntryAttachmentRepo {
  save(
    journalEntryId: TEntityId,
    attachments: IFileAttachment[],
    options: IWriteRepoOptions
  ): Promise<void>;
}
