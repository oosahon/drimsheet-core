import { IRepoOptions } from '../../../shared/types/repo.types';
import {
  IJournalEntryHistory,
  IJournalLineHistory,
} from './journal-entry-audit.types';
import { IJournalEntry } from './journal-entry.types';

export default interface IJournalEntryPersistenceService {
  create(
    entry: IJournalEntry,
    headerHistory: IJournalEntryHistory,
    linesHistory: IJournalLineHistory[],
    repoOptions: IRepoOptions
  ): Promise<void>;
}
