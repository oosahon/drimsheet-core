import { IWriteRepoOptions } from '@shared/types/repo.types';

import {
  IJournalEntryHistory,
  IJournalEntryRectificationHistory,
} from '@domain/journal-entry/types/journal-entry-audit.types';
import { IJournalHeader } from '@domain/journal-entry/types/journal-entry.types';

export default interface IJournalEntryHistoryRepo {
  create(
    header: IJournalHeader | IJournalHeader[],
    history:
      | IJournalEntryHistory
      | IJournalEntryRectificationHistory
      | (IJournalEntryHistory | IJournalEntryRectificationHistory)[],
    options: IWriteRepoOptions
  ): Promise<void>;
}
