import { IReadRepoOptions, IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import { IJournalEntryHistory } from '@domain/journal-entry/types/journal-entry-audit.types';
import {
  IJournalEntry,
  IJournalHeader,
} from '@domain/journal-entry/types/journal-entry.types';

export default interface IJournalEntryRepo {
  create(
    payload: IJournalHeader | IJournalHeader[],
    options: IWriteRepoOptions<IJournalEntryHistory | IJournalEntryHistory[]>
  ): Promise<void>;

  findById(
    id: TEntityId,
    options: IReadRepoOptions
  ): Promise<IJournalEntry | null>;
}
