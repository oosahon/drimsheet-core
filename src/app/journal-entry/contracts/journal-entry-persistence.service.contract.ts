import { IRepoOptions } from '@shared/types/repo.types';

import {
  IJournalEntryHistory,
  IJournalLineHistory,
} from '@domain/journal-entry/types/journal-entry-audit.types';
import { IJournalEntry } from '@domain/journal-entry/types/journal-entry.types';

export default interface IJournalEntryPersistenceService {
  create(
    entry: IJournalEntry,
    headerHistory: IJournalEntryHistory,
    linesHistory: IJournalLineHistory[],
    repoOptions: IRepoOptions
  ): Promise<void>;
}
