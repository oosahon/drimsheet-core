import { IRepoOptions } from '../../../shared/types/repo.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IJournalEntry } from '../types/journal-entry.types';

export default interface IJournalEntryRepo {
  save(
    payload: IJournalEntry | IJournalEntry[],
    options: IRepoOptions
  ): Promise<void>;

  findById(id: TEntityId, options: IRepoOptions): Promise<IJournalEntry | null>;
}
