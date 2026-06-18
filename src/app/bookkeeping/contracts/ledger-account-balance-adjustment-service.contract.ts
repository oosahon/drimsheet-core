import { IJournalEntry } from '../../../domain/journal-entry/types/journal-entry.types';
import { IReadRepoOptions } from '../../../shared/types/repo.types';

export interface ILedgerAccountBalancePropagationService {
  propagate(
    journalEntry: IJournalEntry,
    repoOptions: IReadRepoOptions
  ): Promise<void>;
}
